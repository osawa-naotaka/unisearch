@group(0) @binding(0) var<storage, read_write> data: array<u32>;
@group(0) @binding(1) var<storage, read_write> keyword: array<u32>;
@group(0) @binding(2) var<storage, read_write> result: array<u32>;
@group(0) @binding(3) var<storage, read_write> ptr: atomic<u32>;

@compute @workgroup_size(1) fn cs(
    @builtin(global_invocation_id) id: vec3u
) {
    let keyword_len = arrayLength(&keyword);
    let data_len = arrayLength(&data);
    for(var pos = 0u; pos < keyword_len; pos++) {
        let data_pos = id.x + pos;
        if(data_pos >= data_len || data[id.x + pos] != keyword[pos]) {
            return ;
        }
    }
    let pos = atomicAdd(&ptr, 1u);
    result[pos] = id.x;
}
