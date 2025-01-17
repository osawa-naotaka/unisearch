@group(0) @binding(0) var<storage, read> data: array<vec4u>;
@group(0) @binding(2) var<storage, read_write> result: array<u32>;
@group(0) @binding(3) var<storage, read_write> pointer: atomic<u32>;

@compute @workgroup_size(256) fn cs(
    @builtin(global_invocation_id) id: vec3u
) {
    let keyword = vec4u(30164, 30164, 30164, 30164);
    let cmp = keyword == data[id.x];
    if(any(cmp) == false) {
        return ;
    }

    if(cmp[0]) {
        let ptr_pos = atomicAdd(&pointer, 1u);
        result[ptr_pos] = id.x * 4 + 0;
    }

    if(cmp[1]) {
        let ptr_pos = atomicAdd(&pointer, 1u);
        result[ptr_pos] = id.x * 4 + 1;
    }

    if(cmp[2]) {
        let ptr_pos = atomicAdd(&pointer, 1u);
        result[ptr_pos] = id.x * 4 + 2;
    }

    if(cmp[3]) {
        let ptr_pos = atomicAdd(&pointer, 1u);
        result[ptr_pos] = id.x * 4 + 3;
    }
}
