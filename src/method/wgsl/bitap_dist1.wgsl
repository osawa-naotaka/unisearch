@group(0) @binding(0) var<storage, read> data: array<u32>;
@group(0) @binding(1) var<storage, read_write> result: array<u32>;
@group(0) @binding(2) var<storage, read_write> pointer: atomic<u32>;
@group(0) @binding(3) var<uniform> end_mask: u32;
@group(0) @binding(4) var<storage, read> bitap_dict: array<u32>;
@group(0) @binding(5) var<uniform> keyword_len: u32;
@group(0) @binding(6) var<uniform> dict_size: u32;


@compute @workgroup_size(256) fn cs(
    @builtin(global_invocation_id) id: vec3u
) {
    const vec_zero = vec2u(0u, 0u);
    const vec_one  = vec2u(1u, 1u);
    let end_mask_v = vec2u(end_mask, end_mask);
    var state = vec_zero;

    let end_pos = id.x + keyword_len + 1; // 1 means distance 1
    var dist = 4u;
    var tail_pos = 0u;
    for(var pos = id.x; pos < end_pos; pos++) {
        var mask = 0u;
        for(var i = 0u; i < dict_size; i += 2) {
            mask = select(mask, bitap_dict[i + 1], bitap_dict[i] == data[pos]);
        }

        // calc all next state candidates
        let next_state_candidate = (state << vec_one) | vec_one;
        let next_state_candidate_mask = next_state_candidate & vec2u(mask, mask);

        let deletion = (next_state_candidate_mask << vec_one) | vec_one;
        let insertion = state;

        let replace_1 = next_state_candidate[0];

        // state update
        state[0] = next_state_candidate_mask[0];
        state[1] = next_state_candidate_mask[1] | replace_1 | insertion[0] | deletion[0];

        // mach check
        let matches = (state & end_mask_v) != vec_zero;
        if(any(matches)) {
            let d = select(1u, 0u, matches[0]);
            if(d < dist) {
                tail_pos = pos;
                dist = d;
            }
        }
    }

    if(dist < 4u) {
        let ptr_pos = atomicAdd(&pointer, 1u);
        result[ptr_pos * 2] = bitcast<u32>(max(0, bitcast<i32>(tail_pos) - bitcast<i32>(keyword_len) + 1));
        result[ptr_pos * 2 + 1] = dist;
    }
}
