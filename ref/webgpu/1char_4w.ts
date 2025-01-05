import cs from "@ref/webgpu/1char_4w.wgsl?raw";

export async function run_1char_4w(device: GPUDevice, buffers: Record<string, GPUBuffer>, name: string) {
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
            { binding: 2, resource: { buffer: buffers.result } },
            { binding: 3, resource: { buffer: buffers.result_ptr } },
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
    pass.dispatchWorkgroups(buffers.data.size / 4 / 4 / 256);
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
    
        console.log("time", end - start, "ms, result ptr:", resultPtr);
    }

    buffers.result_ptr_copy.unmap();
}
