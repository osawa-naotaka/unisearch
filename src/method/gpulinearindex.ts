import type { SearchEnv, SearchResult } from "@src/frontend/base";
import { LinearIndex } from "@src/method/linearindex";
import bitap_dist1 from "@src/method/wgsl/bitap_dist1.wgsl?raw";
import bitap_dist2 from "@src/method/wgsl/bitap_dist2.wgsl?raw";
import bitap_dist3 from "@src/method/wgsl/bitap_dist3.wgsl?raw";
import { bitapKeyNumber, createBitapKey } from "@src/util/algorithm";
import { Mutex } from "@src/util/mutex";
import { splitByGrapheme } from "@src/util/preprocess";

type GPUBuffers = {
    content: GPUBuffer;
    result: GPUBuffer;
    pointer: GPUBuffer;
    end_mask: GPUBuffer;
    bitap_dict: GPUBuffer;
    keyword_len: GPUBuffer;
    result_copy: GPUBuffer;
    pointer_copy: GPUBuffer;
};

export class GPULinearIndex extends LinearIndex {
    private mutex = new Mutex();
    private device: GPUDevice | undefined = undefined;
    private gpu_buffers: GPUBuffers | undefined = undefined;
    private gpu_pipeline: GPUComputePipeline[] = [];
    private gpu_bind_group: GPUBindGroup | undefined = undefined;
    private readonly num_result: number = 4096 * 128;

    private gpuStorageRead(device: GPUDevice, size: number): GPUBuffer {
        return device.createBuffer({
            size: size,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
    }

    private gpuStorageWrite(device: GPUDevice, size: number): GPUBuffer {
        return device.createBuffer({
            size: size,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });
    }

    private gpuStorageReadWrite(device: GPUDevice, size: number): GPUBuffer {
        return device.createBuffer({
            size: size,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });
    }

    private gpuUniform(device: GPUDevice, size: number): GPUBuffer {
        return device.createBuffer({
            size: size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }

    private gpuCopy(device: GPUDevice, size: number): GPUBuffer {
        return device.createBuffer({
            size: size,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });
    }

    private gpuPipeline(device: GPUDevice, code: string): GPUComputePipeline {
        const gpu_module = device.createShaderModule({ code: code });
        return device.createComputePipeline({
            layout: "auto",
            compute: {
                module: gpu_module,
                entryPoint: "cs",
            },
        });
    }

    private async initGPU(): Promise<void> {
        const adapter = await navigator.gpu?.requestAdapter();
        this.device = await adapter?.requestDevice();
        if (this.device === undefined) return;

        this.gpu_buffers = {
            content: this.gpuStorageRead(this.device, this.index_entry.content_length * 4),
            result: this.gpuStorageWrite(this.device, this.num_result * 4 * 2),
            pointer: this.gpuStorageReadWrite(this.device, 4),
            end_mask: this.gpuUniform(this.device, 4 * 4),
            bitap_dict: this.gpuStorageRead(this.device, 4 * 2 * 32),
            keyword_len: this.gpuUniform(this.device, 4),
            result_copy: this.gpuCopy(this.device, this.num_result * 4 * 2),
            pointer_copy: this.gpuCopy(this.device, 4),
        };

        await this.mutex.acquire();
        this.device.queue.writeBuffer(this.gpu_buffers.content, 0, this.gpu_content);
        this.mutex.release();

        this.gpu_pipeline[1] = this.gpuPipeline(this.device, bitap_dist1);
        this.gpu_pipeline[2] = this.gpuPipeline(this.device, bitap_dist2);
        this.gpu_pipeline[3] = this.gpuPipeline(this.device, bitap_dist3);

        this.gpu_bind_group = this.device.createBindGroup({
            layout: this.gpu_pipeline[1].getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.gpu_buffers.content } },
                { binding: 1, resource: { buffer: this.gpu_buffers.result } },
                { binding: 2, resource: { buffer: this.gpu_buffers.pointer } },
                { binding: 3, resource: { buffer: this.gpu_buffers.end_mask } },
                { binding: 4, resource: { buffer: this.gpu_buffers.bitap_dict } },
                { binding: 5, resource: { buffer: this.gpu_buffers.keyword_len } },
            ],
        });
    }

    public override async search(env: SearchEnv, keyword: string): Promise<SearchResult[]> {
        const grapheme = splitByGrapheme(keyword).map((x) => x.charCodeAt(0));
        const is_gpu_searchable =
            grapheme.length <= 32 && env.distance !== undefined && env.distance > 0 && env.distance < 4;

        if (is_gpu_searchable) {
            if (this.device === undefined) {
                await this.initGPU();
            }
            return this.device && this.gpu_buffers
                ? this.gpuSearch(this.device, this.gpu_buffers, env, grapheme)
                : super.search(env, keyword);
        }

        return super.search(env, keyword);
    }

    private async gpuSearch(
        device: GPUDevice,
        gpu_buffers: GPUBuffers,
        env: SearchEnv,
        grapheme: number[],
    ): Promise<SearchResult[]> {
        await this.mutex.acquire();
        const bitap_key = createBitapKey<number, number>(bitapKeyNumber(), grapheme);
        const bitap_dict_tmp = [];
        for (const [key, mask] of bitap_key.mask.entries()) {
            bitap_dict_tmp.push(key);
            bitap_dict_tmp.push(mask);
        }
        const bitap_dict = new Uint32Array(bitap_dict_tmp);
        device.queue.writeBuffer(gpu_buffers.bitap_dict, 0, bitap_dict);

        device.queue.writeBuffer(gpu_buffers.pointer, 0, new Uint32Array([0]));
        device.queue.writeBuffer(
            gpu_buffers.end_mask,
            0,
            new Uint32Array(new Array(4).fill(1 << (grapheme.length - 1))),
        );
        device.queue.writeBuffer(gpu_buffers.keyword_len, 0, new Uint32Array([grapheme.length]));

        const pipeline = this.gpu_pipeline[env.distance || 1];

        const encoder = device.createCommandEncoder();
        encoder.pushDebugGroup("bitap");
        const pass = encoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, this.gpu_bind_group);
        pass.dispatchWorkgroups(Math.ceil(this.index_entry.content_length / 256)); // 256 workgroup_size
        pass.end();

        encoder.copyBufferToBuffer(gpu_buffers.result, 0, gpu_buffers.result_copy, 0, gpu_buffers.result.size);
        encoder.copyBufferToBuffer(gpu_buffers.pointer, 0, gpu_buffers.pointer_copy, 0, gpu_buffers.pointer.size);
        encoder.popDebugGroup();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        await gpu_buffers.pointer_copy.mapAsync(GPUMapMode.READ);
        const pointer = new Uint32Array(gpu_buffers.pointer_copy.getMappedRange());
        if (pointer[0] === 0) {
            gpu_buffers.pointer_copy.unmap();
            return [];
        }

        await gpu_buffers.result_copy.mapAsync(GPUMapMode.READ);
        const count = Math.min(pointer[0], this.num_result);
        const gpu_result = new Uint32Array(gpu_buffers.result_copy.getMappedRange(0, count * 4 * 2));
        const raw_result: [number, number][] = [];
        for (let i = 0; i < gpu_result.length; i += 2) {
            raw_result.push([gpu_result[i], gpu_result[i + 1]]);
        }
        gpu_buffers.result_copy.unmap();
        gpu_buffers.pointer_copy.unmap();
        this.mutex.release();

        const poses = this.mergeResults(raw_result.sort((a, b) => a[0] - b[0]));
        return this.createSearchResult(poses, grapheme.map((x) => String.fromCharCode(x)).join(""), env);
    }
}
