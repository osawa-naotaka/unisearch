import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";
import { createIndex, LinearIndex, search, UniSearchError } from "dist/unisearch";
import { defaultNormalizer } from "@src/util/preprocess";
import cs from "./search.wgsl?raw";

const adapter = await navigator.gpu?.requestAdapter();
const device = await adapter?.requestDevice();
if (!device) {
  throw new Error('need a browser that supports WebGPU');
}

const module = device.createShaderModule({
    label: 'search test module',
    code: cs,
});

const pipeline = device.createComputePipeline({
    label: 'search test pipeline',
    layout: 'auto',
    compute: {
      module,
    },
});

const kwd = "アンパサンド";
const input = new Uint32Array([...(defaultNormalizer(wikipedia_ja_extracted[0].text))].map((x) => x.charCodeAt(0)));
const keyword = new Uint32Array([...kwd].map((x) => x.charCodeAt(0)));

// create a buffer on the GPU to hold our computation
const dataBuffer = device.createBuffer({
    label: 'data buffer',
    size: input.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(dataBuffer, 0, input);

const keywordBuffer = device.createBuffer({
    label: 'keyword buffer',
    size: keyword.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(keywordBuffer, 0, keyword);

const resultBuffer = device.createBuffer({
    label: 'result buffer',
    size: input.byteLength * 2,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
});

const resultPtrBuffer = device.createBuffer({
    label: 'result pointer buffer',
    size: 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(resultPtrBuffer, 0, new Uint32Array([0]));

// create a buffer on the GPU to get a copy of the results
const resultCopyBuffer = device.createBuffer({
    label: 'result copy buffer',
    size: input.byteLength * 2,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
});

const resultPtrCopyBuffer = device.createBuffer({
    label: 'result pointer copy buffer',
    size: 4,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
});


// Setup a bindGroup to tell the shader which
// buffer to use for the computation
const bindGroup = device.createBindGroup({
    label: 'bindGroup for buffers',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
        { binding: 0, resource: { buffer: dataBuffer } },
        { binding: 1, resource: { buffer: keywordBuffer } },
        { binding: 2, resource: { buffer: resultBuffer } },
        { binding: 3, resource: { buffer: resultPtrBuffer } },
    ],
});

// Encode commands to do the computation
const encoder = device.createCommandEncoder({
    label: 'search encoder',
});
const pass = encoder.beginComputePass({
    label: 'search compute pass',
});
pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroup);
pass.dispatchWorkgroups(input.length);
pass.end();

// Encode a command to copy the results to a mappable buffer.
encoder.copyBufferToBuffer(resultBuffer, 0, resultCopyBuffer, 0, resultBuffer.size);
encoder.copyBufferToBuffer(resultPtrBuffer, 0, resultPtrCopyBuffer, 0, resultPtrBuffer.size);

// Finish encoding and submit the commands
const commandBuffer = encoder.finish();
const start = performance.now();
device.queue.submit([commandBuffer]);

// Read the results
await resultPtrCopyBuffer.mapAsync(GPUMapMode.READ);
const resultPtr = new Uint32Array(resultPtrCopyBuffer.getMappedRange());

await resultCopyBuffer.mapAsync(GPUMapMode.READ);
const result = new Uint32Array(resultCopyBuffer.getMappedRange(0, resultPtr[0] * 4));
const end = performance.now();

console.log('time', end - start, "ms");
console.log('input', input);
console.log('keyword', keyword);
console.log('result', result.sort());
console.log('result ptr', resultPtr);

resultBuffer.unmap();
resultPtrBuffer.unmap();


const idx = createIndex(LinearIndex, [wikipedia_ja_extracted[0]]);
if(idx instanceof UniSearchError) {
    throw idx;
} else {
    const st = performance.now();
    const res = search(idx, "アンパサンド");
    const ed = performance.now();
    console.log(res);
    console.log("time", ed - st);    
}
