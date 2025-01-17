import { defaultNormalizer } from "@src/util/preprocess";
import { wikipedia_ja_extracted_1000 } from "@test/wikipedia_ja_extracted_1000";
import { createBitapKey, bitapKeyNumber } from "@src/util/algorithm";
import { run_1char } from "@ref/webgpu/1char";
import { run_1char_4w } from "@ref/webgpu/1char_4w";
import { run_1char_4w_uniform } from "@ref/webgpu/1char_4w_uniform";
import { run_loop_1char_uniform } from "@ref/webgpu/loop_1char_uniform";
import { run_keyword } from "@ref/webgpu/keyword";
import { run_bitap_dist1_amp } from "@ref/webgpu/bitap_dist1_amp";
import { run_bitap_dist3_amp } from "@ref/webgpu/bitap_dist3_amp";
import { run_bitap_dist3 } from "@ref/webgpu/bitap_dist3";

// get gpu device
const adapter = await navigator.gpu?.requestAdapter();
const device = await adapter?.requestDevice();
if (!device) {
    throw new Error("need a browser that supports WebGPU");
}

// prepare search target
const article = wikipedia_ja_extracted_1000.slice(0, 1000);

const input = new Uint32Array(
    [...article.flatMap((x) => defaultNormalizer(x.text)).join("")].map((x) => x.charCodeAt(0)),
);

const kwd = defaultNormalizer("アンパサンド");
const keyword = new Uint32Array([...kwd].map((x) => x.charCodeAt(0)));

const bkey = createBitapKey<number, number>(bitapKeyNumber(), [...kwd].map((x) => x.charCodeAt(0)));
const bitap_key_tmp = [];
for(const [key, mask] of bkey.mask.entries()) {
    bitap_key_tmp.push(key);
    bitap_key_tmp.push(mask);
}
const bitap_key = new Uint32Array(bitap_key_tmp);

for(let i = bitap_key_tmp.length; i < 64; i++) {
    bitap_key_tmp.push(0);
}
const bitap_dict = new Uint32Array(bitap_key_tmp);

const num_result = 4096 * 1024;

const gpu_buffers = {
    data: device.createBuffer({
        label: `data buffer`,
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),

    result: device.createBuffer({
        label: `result buffer`,
        size: num_result * 4 * 2,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    }),

    result_ptr: device.createBuffer({
        label: `result pointer buffer`,
        size: 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    }),

    result_copy: device.createBuffer({
        label: `result copy buffer`,
        size: num_result * 4 * 2,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    }),

    result_ptr_copy: device.createBuffer({
        label: `result pointer copy buffer`,
        size: 4,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    }),

    keyword_1char_uniform: device.createBuffer({
        label: "keyword 1char uniform 4vec",
        size: 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }),

    loop_cnt: device.createBuffer({
        label: "loop count max",
        size: 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }),

    keyword: device.createBuffer({
        label: "keyword",
        size: keyword.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),

    bitap_key: device.createBuffer({
        label: "bitap key buffer",
        size: bitap_key.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),

    end_mask: device.createBuffer({
        label: "bitap end mask",
        size: 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }),

    bitap_dict: device.createBuffer({
        label: "bitap dict",
        size: 4 * 2 * 32,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }),

    keyword_len: device.createBuffer({
        label: "keyword len",
        size: 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }),

    bitap_dict_len: device.createBuffer({
        label: "bitap dict len",
        size: 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }),
};

const start = performance.now();
device.queue.writeBuffer(gpu_buffers.data, 0, input);
device.queue.writeBuffer(gpu_buffers.result_ptr, 0, new Uint32Array([0]));
device.queue.writeBuffer(gpu_buffers.keyword_1char_uniform, 0, new Uint32Array([..."痔痔痔痔"].map((x) => x.charCodeAt(0))));
device.queue.writeBuffer(gpu_buffers.loop_cnt, 0, new Uint32Array([1]));
device.queue.writeBuffer(gpu_buffers.keyword, 0, keyword);
device.queue.writeBuffer(gpu_buffers.bitap_key, 0, bitap_key);
device.queue.writeBuffer(gpu_buffers.end_mask, 0, new Uint32Array(new Array(4).fill(1 << (keyword.length - 1))));
device.queue.writeBuffer(gpu_buffers.bitap_dict, 0, new Uint32Array(bitap_dict));
device.queue.writeBuffer(gpu_buffers.keyword_len, 0, new Uint32Array([keyword.length]));
device.queue.writeBuffer(gpu_buffers.bitap_dict_len, 0, new Uint32Array([Math.ceil(keyword.length / 2)]));
const end = performance.now();

console.log(bitap_key)
console.log(`GPU buffer transfer time: ${end - start} ms.`);

while(true) {
    await run_1char(device, gpu_buffers, "1char");
    await run_1char_4w(device, gpu_buffers, "1char 4w");
    await run_1char_4w_uniform(device, gpu_buffers, "uniform 1char 4w");
    await run_loop_1char_uniform(device, gpu_buffers, "4loop 1char uniform", 4);
    await run_loop_1char_uniform(device, gpu_buffers, "1024loop 1char uniform", 1024);
    await run_keyword(device, gpu_buffers, "keyword uniform");
    await run_bitap_dist1_amp(device, gpu_buffers, "1 amp bitap");
    await run_bitap_dist3_amp(device, gpu_buffers, "3 amp bitap");
    await run_bitap_dist3(device, gpu_buffers, "3 bitap");
}
