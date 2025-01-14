import { type SearchEnv, type SearchResult } from "@src/frontend/base";
import { bitapKeyNumber, createBitapKey } from "@src/util/algorithm";
import { splitByGrapheme } from "@src/util/preprocess";
import { FlatLinearIndexString } from "./flatlinearindexstring";
import bitap_dist1 from "@src/method/wgsl/bitap_dist1.wgsl?raw";
import bitap_dist2 from "@src/method/wgsl/bitap_dist2.wgsl?raw";
import bitap_dist3 from "@src/method/wgsl/bitap_dist3.wgsl?raw";

export class GPULinearIndex extends FlatLinearIndexString {
    private device: GPUDevice | undefined = undefined;
    private gpu_buffers: GPUBuffer[] = [];
    private gpu_module_dist1: GPUShaderModule | undefined = undefined;
    private gpu_module_dist2: GPUShaderModule | undefined = undefined;
    private gpu_module_dist3: GPUShaderModule | undefined = undefined;

    private async initGPU(): Promise<void> {
        const adapter = await navigator.gpu?.requestAdapter();
        this.device = await adapter?.requestDevice();
        if (this.device === undefined) return;

        this.gpu_buffers[0] = this.device.createBuffer({
            label: "gpu_content buffer",
            size: this.gpu_content.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(this.gpu_buffers[0], 0, this.gpu_content);

        this.gpu_buffers[1] = this.device.createBuffer({
            label: "gpu_result buffer",
            size: this.num_result * 4 * 2,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });

        this.gpu_buffers[2] = this.device.createBuffer({
            label: "gpu_pointer buffer",
            size: 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        this.gpu_buffers[3] = this.device.createBuffer({
            label: "gpu_end_mask uniform",
            size: 4 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.gpu_buffers[4] = this.device.createBuffer({
            label: "gpu_bitap_dict uniform",
            size: 4 * 2 * 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.gpu_buffers[5] = this.device.createBuffer({
            label: "gpu_keyword_len uniform",
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.gpu_buffers[6] = this.device.createBuffer({
            label: "gpu_bitap_dict_len uniform",
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.gpu_buffers[7] = this.device.createBuffer({
            label: "gpu_result_copy buffer",
            size: this.num_result * 4 * 2,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });

        this.gpu_buffers[8] = this.device.createBuffer({
            label: "gpu_pointer_copy buffer",
            size: 4,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });

        this.gpu_module_dist1 = this.device.createShaderModule({
            label: "gpu_dist1_module",
            code: bitap_dist1,
        });

        this.gpu_module_dist2 = this.device.createShaderModule({
            label: "gpu_dist2_module",
            code: bitap_dist2,
        });

        this.gpu_module_dist3 = this.device.createShaderModule({
            label: "gpu_dist3_module",
            code: bitap_dist3,
        });
    }

    public override async search(env: SearchEnv, keyword: string): Promise<SearchResult[]> {
        if (env.distance === undefined || env.distance === 0 || !this.isGPUSearchable(keyword)) {
            return super.search(env, keyword);
        }
        return this.gpuSearch(env, keyword);
    }

    private isGPUSearchable(keyword: string): boolean {
        const grapheme = splitByGrapheme(keyword);
        return grapheme.length <= 32;
    }

    private async gpuSearch(env: SearchEnv, keyword: string): Promise<SearchResult[]> {
        if (this.device === undefined) {
            await this.initGPU();
        }
        if (this.device === undefined) {
            return super.search(env, keyword);
        }

        const grapheme = splitByGrapheme(keyword).map(x => x.charCodeAt(0));
        const bitap_key = createBitapKey<number, number>(bitapKeyNumber(), grapheme);
        const bitap_key_tmp = [];
        for (const [key, mask] of bitap_key.mask.entries()) {
            bitap_key_tmp.push(key);
            bitap_key_tmp.push(mask);
        }
        for (let i = bitap_key_tmp.length; i < 64; i++) {
            bitap_key_tmp.push(0);
        }
        const bitap_dict = new Uint32Array(bitap_key_tmp);
        this.device.queue.writeBuffer(this.gpu_buffers[4], 0, bitap_dict);

        this.device.queue.writeBuffer(this.gpu_buffers[2], 0, new Uint32Array([0]));
        this.device.queue.writeBuffer(
            this.gpu_buffers[3],
            0,
            new Uint32Array(new Array(4).fill(1 << (grapheme.length - 1))),
        );
        this.device.queue.writeBuffer(this.gpu_buffers[5], 0, new Uint32Array([grapheme.length]));
        this.device.queue.writeBuffer(
            this.gpu_buffers[6],
            0,
            new Uint32Array([Math.ceil(grapheme.length / 2)]),
        );

        if (this.gpu_module_dist1 === undefined) throw new Error("gpu_module_dist1 is undefined");
        const pipeline = this.device.createComputePipeline({
            label: "bitap search pipeline",
            layout: "auto",
            compute: {
                module: this.gpu_module_dist1,
                entryPoint: "cs"
            },
        });

        const bindGroup = this.device.createBindGroup({
            label: "bitap bindGroup for buffers",
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.gpu_buffers[0] } },
                { binding: 1, resource: { buffer: this.gpu_buffers[1] } },
                { binding: 2, resource: { buffer: this.gpu_buffers[2] } },
                { binding: 3, resource: { buffer: this.gpu_buffers[3] } },
                { binding: 4, resource: { buffer: this.gpu_buffers[4] } },
                { binding: 5, resource: { buffer: this.gpu_buffers[5] } },
                { binding: 6, resource: { buffer: this.gpu_buffers[6] } },
            ],
        });

        const encoder = this.device.createCommandEncoder({
            label: "bitap search encoder",
        });
        encoder.pushDebugGroup("bitap");
        const pass = encoder.beginComputePass({
            label: "bitap search compute pass",
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(Math.ceil(this.index_entry.content_length / 256)); // 256 workgroup_size
        pass.end();

        encoder.copyBufferToBuffer(this.gpu_buffers[1], 0, this.gpu_buffers[7], 0, this.gpu_buffers[1].size);
        encoder.copyBufferToBuffer(this.gpu_buffers[2], 0, this.gpu_buffers[8], 0, this.gpu_buffers[2].size);
        encoder.popDebugGroup();

        const commandBuffer = encoder.finish();
        this.device.queue.submit([commandBuffer]);

        await this.gpu_buffers[8].mapAsync(GPUMapMode.READ);
        const pointer = new Uint32Array(this.gpu_buffers[8].getMappedRange());
        if (pointer[0] === 0) {
            this.gpu_buffers[8].unmap();
            return [];
        }

        await this.gpu_buffers[7].mapAsync(GPUMapMode.READ);
        const count = Math.min(pointer[0], this.num_result);
        const gpu_result = new Uint32Array(this.gpu_buffers[7].getMappedRange(0, count * 4 * 2));
        const raw_result: [number, number][] = [];
        for (let i = 0; i < gpu_result.length; i += 2) {
            raw_result.push([gpu_result[i], gpu_result[i + 1]]);
        }
        this.gpu_buffers[7].unmap();
        this.gpu_buffers[8].unmap();

        const poses = this.mergeResults(raw_result.sort((a, b) => a[0] - b[0]));
        return this.createSearchResult(poses, keyword, env.weight);
    }
}
