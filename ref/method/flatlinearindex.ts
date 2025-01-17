import type { Path, SearchEnv, SearchIndex, SearchResult } from "@src/frontend/base";
import { UniSearchError } from "@src/frontend/base";
import bitap_dist1 from "@ref/method/wgsl/bitap_dist1.wgsl?raw";
import {
    BinarySearchType,
    binarySearch,
    bitapKeyBigint,
    bitapKeyNumber,
    bitapSearch,
    createBitapKey,
} from "@src/util/algorithm";
import { excerptOneCodepointPerGraphem, splitByGrapheme } from "@src/util/preprocess";

export type ContentRange = {
    id: number;
    path: string;
    start: number;
    end: number;
};

type ContentRef = {
    id: number;
    path: string;
    pos: number;
    size: number;
};

export type FlatLinearIndexEntry = { key: string[]; gpu_content: Uint32Array; toc: ContentRange[]; num_id: number };

export class FlatLinearIndex implements SearchIndex<FlatLinearIndexEntry> {
    public index_entry: FlatLinearIndexEntry;
    private readonly num_result: number = 4096 * 1024;
    private content: string;

    private device: GPUDevice | undefined = undefined;
    private gpu_buffers: GPUBuffer[] = [];
    private gpu_module_dist1: GPUShaderModule | undefined = undefined;

    public constructor(index?: FlatLinearIndexEntry) {
        this.index_entry = index || { key: [], gpu_content: new Uint32Array(), toc: [], num_id: 0 };
        this.content = "";
        if (index) {
            for (const cp of index.gpu_content) {
                this.content += String.fromCharCode(cp);
            }
        }
    }

    public setToIndex(id: number, path: Path, str: string): void {
        const graphemes = excerptOneCodepointPerGraphem(str);
        const start = this.content.length;
        const end = start + graphemes.length - 1;
        this.content += graphemes;
        this.index_entry.toc.push({ id: id, path: path, start: start, end: end });
        this.index_entry.num_id = Math.max(this.index_entry.num_id, id + 1);
    }

    public addKey(id: number, key: string): void {
        this.index_entry.key[id] = key;
    }

    public fixIndex(): void {
        this.index_entry.gpu_content = new Uint32Array(this.content.length);
        for (let i = 0; i < this.content.length; i++) {
            this.index_entry.gpu_content[i] = this.content.charCodeAt(i);
        }
    }

    public async search(env: SearchEnv, keyword: string): Promise<SearchResult[]> {
        let poses: [number, number][] = [];
        if (env.distance === undefined || env.distance === 0) {
            poses = this.allIndexOf(keyword, this.content);
        } else {
            const grapheme = splitByGrapheme(keyword).map((x) => x.charCodeAt(0));
            let raw_result: [number, number][];
            if (this.device === undefined) {
                await this.initGPU();
            }
            if (grapheme.length <= 32 && this.device !== undefined) {
                const bitap_key = createBitapKey<number, number>(bitapKeyNumber(), grapheme);
                const bitap_key_tmp = [];
                for (const [key, mask] of bitap_key.mask.entries()) {
                    bitap_key_tmp.push(key);
                    bitap_key_tmp.push(mask);
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

                if (this.gpu_module_dist1 === undefined) throw new Error("gpu_module_dist1 is undefined");
                const pipeline = this.device.createComputePipeline({
                    label: "bitap search pipeline",
                    layout: "auto",
                    compute: {
                        module: this.gpu_module_dist1,
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
                pass.dispatchWorkgroups(this.index_entry.gpu_content.length / 256); // 256 workgroup_size
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
                raw_result = [];
                for (let i = 0; i < gpu_result.length; i += 2) {
                    raw_result.push([gpu_result[i], gpu_result[i + 1]]);
                }
                raw_result = raw_result.sort((a, b) => a[0] - b[0]);
                this.gpu_buffers[7].unmap();
                this.gpu_buffers[8].unmap();
            } else if (grapheme.length < 50) {
                const key = createBitapKey<number, number>(bitapKeyNumber(), grapheme);
                raw_result = bitapSearch(key, env.distance, this.index_entry.gpu_content);
            } else {
                const key = createBitapKey<bigint, number>(bitapKeyBigint(), grapheme);
                raw_result = bitapSearch(key, env.distance, this.index_entry.gpu_content);
            }

            let latest_item = raw_result[0];
            let latest_pos = latest_item[0];

            for (const [pos, distance] of raw_result.slice(1)) {
                if (latest_pos + 1 === pos || latest_pos === pos) {
                    latest_pos = pos;
                    if (distance < latest_item[1]) {
                        latest_item = [pos, distance];
                    }
                } else {
                    poses.push(latest_item);
                    latest_item = [pos, distance];
                    latest_pos = pos;
                }
            }

            poses.push(latest_item);
        }

        const result = new Map<number, SearchResult>();
        const content_size = new Map<number, Map<string, number>>();
        for (const pos of poses) {
            const cref = this.getReference(pos[0]);
            const r = result.get(cref.id) || { id: cref.id, key: this.index_entry.key[cref.id], score: 0, refs: [] };
            r.refs.push({
                token: keyword,
                path: cref.path,
                pos: cref.pos,
                wordaround: this.content.slice(Math.max(pos[0] - 20, 0), pos[0] + keyword.length + 20),
                distance: pos[1],
            });
            result.set(cref.id, r);

            const id_size = content_size.get(cref.id) || new Map<string, number>();
            id_size.set(cref.path, cref.size);
            content_size.set(cref.id, id_size);
        }

        const idf = Math.log(this.index_entry.num_id / (result.size + 1)) + 1;
        for (const [_, r] of result) {
            const tf = r.refs
                .map(
                    (v) =>
                        v.token.length /
                        (content_size.get(r.id)?.get(v.path) || Number.POSITIVE_INFINITY) /
                        (v.distance + 1),
                )
                .reduce((x, y) => x + y);
            r.score = tf * idf * (env.weight || 1);
        }

        return Array.from(result.values());
    }

    private async initGPU(): Promise<void> {
        const adapter = await navigator.gpu?.requestAdapter();
        this.device = await adapter?.requestDevice();
        if (this.device === undefined) return;

        this.gpu_buffers[0] = this.device.createBuffer({
            label: "gpu_content buffer",
            size: this.index_entry.gpu_content.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(this.gpu_buffers[0], 0, this.index_entry.gpu_content);

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
            label: "gpu_bitap_dict buffer",
            size: 4 * 2 * 32,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
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

    }

    private allIndexOf(keyword: string, content: string): [number, number][] {
        const result: [number, number][] = [];
        const grapheme = excerptOneCodepointPerGraphem(keyword);
        let pos = content.indexOf(grapheme);
        while (pos !== -1) {
            result.push([pos, 0]);
            pos = content.indexOf(grapheme, pos + grapheme.length);
        }
        return result;
    }

    private getReference(pos: number): ContentRef {
        const index = binarySearch(
            { id: 0, path: "", start: pos, end: pos },
            (a, b) => (a.start < b.start ? -1 : a.end > b.end ? 1 : 0),
            this.index_entry.toc,
            BinarySearchType.Exact,
        );
        if (index === null) throw new UniSearchError("unisearch.js: getReference internal error.");
        const toc = this.index_entry.toc[index];
        return {
            id: toc.id,
            path: toc.path,
            pos: pos - toc.start,
            size: toc.end - toc.start + 1,
        };
    }
}
