@group(0) @binding(0) var<storage, read> data: array<u32>;
@group(0) @binding(1) var<storage, read_write> result: array<u32>;
@group(0) @binding(2) var<storage, read_write> pointer: atomic<u32>;
@group(0) @binding(3) var<uniform> end_mask: u32;
@group(0) @binding(4) var<uniform> bitap_dict: array<vec4u, 16>;
@group(0) @binding(5) var<uniform> keyword_len: u32;
@group(0) @binding(6) var<uniform> bitap_dict_len: u32;


@compute @workgroup_size(256) fn cs(
    @builtin(global_invocation_id) id: vec3u
) {
    var state = 0u;
    let end_pos = id.x + keyword_len;
    for(var pos = id.x; pos < end_pos; pos++) {
        var mask = 0u;
        for(var i = 0u; i < bitap_dict_len; i++) {
            mask = select(mask, bitap_dict[i][1], bitap_dict[i][0] == data[pos]);
            mask = select(mask, bitap_dict[i][3], bitap_dict[i][2] == data[pos]);
        }

        let next_state_candidate = (state << 1u) | 1u;
        state = ((state << 1u) | 1u) & mask;

        let matches = (state & end_mask) != 0u;
        if(matches) {
            let ptr_pos = atomicAdd(&pointer, 1u);
            result[ptr_pos * 2] = pos;
            result[ptr_pos * 2 + 1] = 0;
        }
    }
}
