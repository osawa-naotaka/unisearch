import cs from "@ref/webgpu/bitap_dist3.wgsl?raw";

export async function run_bitap_dist3(device: GPUDevice, buffers: Record<string, GPUBuffer>, name: string) {
    device.queue.writeBuffer(buffers.result_ptr, 0, new Uint32Array([0]));
    
    const module = device.createShaderModule({
        label: `${name} search module`,
        code: cs,
    });
    
    const pipeline = device.createComputePipeline({
        label: `${name} search pipeline`,
        layout: "auto",
        compute: {
            module,
        },
    });

    // Setup a bindGroup to tell the shader which
    // buffer to use for the computation
    const bindGroup = device.createBindGroup({
        label: `${name} bindGroup for buffers`,
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: buffers.data } },
            { binding: 1, resource: { buffer: buffers.keyword } },
            { binding: 2, resource: { buffer: buffers.result } },
            { binding: 3, resource: { buffer: buffers.result_ptr } },
            { binding: 5, resource: { buffer: buffers.bitap_key } },
            { binding: 8, resource: { buffer: buffers.end_mask } },
        ],
    });

    // Encode commands to do the computation
    const encoder = device.createCommandEncoder({
        label: `${name} search encoder`,
    });
    encoder.pushDebugGroup(`${name}`);
    const pass = encoder.beginComputePass({
        label: `${name} search compute pass`,
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(buffers.data.size / 4 / 256); // 4byte/char, 256 workgroup_size
    pass.end();

    // Encode a command to copy the results to a mappable buffer.
    encoder.copyBufferToBuffer(buffers.result, 0, buffers.result_copy, 0, buffers.result.size);
    encoder.copyBufferToBuffer(buffers.result_ptr, 0, buffers.result_ptr_copy, 0, buffers.result_ptr.size);
    encoder.popDebugGroup();

    // Finish encoding and submit the commands
    const commandBuffer = encoder.finish();

    const start = performance.now();
    device.queue.submit([commandBuffer]);

    // Read the results
    await buffers.result_ptr_copy.mapAsync(GPUMapMode.READ);
    const resultPtr = new Uint32Array(buffers.result_ptr_copy.getMappedRange());

    if(resultPtr[0] === 0) {
        console.log("no match.");
    } else {
        const end = performance.now();
    
        await buffers.result_copy.mapAsync(GPUMapMode.READ);
        if(resultPtr[0] < 4096) {
            const result = new Uint32Array(buffers.result_copy.getMappedRange(0, resultPtr[0] * 4 * 2));
            console.log(toRef(result).sort((a, b) => a.pos - b.pos));
        } else {
            console.log("too meny results. output first 4096 results");
            const result = new Uint32Array(buffers.result_copy.getMappedRange(0, 4096 * 4 * 2));
            console.log(toRef(result).sort((a, b) => a.pos - b.pos));
        }
        buffers.result_copy.unmap();

        console.log("time", end - start, "ms, result ptr:", resultPtr);
    }

    buffers.result_ptr_copy.unmap();
}

type Ref = { pos: number; distance: number; };

function toRef(arr: Uint32Array): Ref[] {

    const result: Ref[] = [];
    for (let i = 0; i < arr.length; i += 2) {
        result.push({ pos: arr[i], distance: arr[i + 1] });
    }
    return result;
}
