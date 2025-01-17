@group(0) @binding(0) var<storage, read> data: array<u32>;
@group(0) @binding(1) var<storage, read> keyword: array<u32>;
@group(0) @binding(2) var<storage, read_write> result: array<u32>;
@group(0) @binding(3) var<storage, read_write> pointer: atomic<u32>;


@compute @workgroup_size(256) fn cs(
    @builtin(global_invocation_id) id: vec3u
) {
    let keyword_len = arrayLength(&keyword);
    for(var pos = 0u; pos < keyword_len; pos++) {
        if(data[id.x + pos] != keyword[pos]) {
            return ;
        }
    }
    let ptr_pos = atomicAdd(&pointer, 1u);
    result[ptr_pos] = id.x;
}
