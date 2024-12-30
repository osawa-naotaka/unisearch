@group(0) @binding(0) var<storage, read> data: array<u32>;
@group(0) @binding(1) var<storage, read> keyword: array<u32>;
@group(0) @binding(2) var<storage, read_write> result: array<u32>;
@group(0) @binding(3) var<storage, read_write> pointer: atomic<u32>;
@group(0) @binding(4) var<storage, read> start_pos: array<u32>;

@compute @workgroup_size(100) fn cs(
    @builtin(global_invocation_id) id: vec3u
) {
    if(id.x >= arrayLength(&start_pos)) {
        return ;
    }
    let keyword_len = arrayLength(&keyword);
    let end_pos = start_pos[id.x + 1u];
    for(var data_start_pos = start_pos[id.x]; data_start_pos < end_pos; data_start_pos++) {
        var keyword_pos = 0u;
        for(; keyword_pos < keyword_len; keyword_pos++) {
            let data_pos = data_start_pos + keyword_pos;
            if(data_pos >= end_pos || data[data_pos] != keyword[keyword_pos]) {
                break ;
            }
        }
        if(keyword_pos == keyword_len) {
            let ptr_pos = atomicAdd(&pointer, 1u);
            result[ptr_pos * 2] = id.x;
            result[ptr_pos * 2 + 1] = data_start_pos - start_pos[id.x];
        }
    }
}
