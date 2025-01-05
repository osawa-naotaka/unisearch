@group(0) @binding(0) var<storage, read> data: array<u32>;
@group(0) @binding(1) var<storage, read> keyword: array<u32>;
@group(0) @binding(2) var<storage, read_write> result: array<u32>;
@group(0) @binding(3) var<storage, read_write> pointer: atomic<u32>;
@group(0) @binding(5) var<storage, read> bitap_key: array<u32>;
@group(0) @binding(8) var<uniform> end_mask: vec4u;


@compute @workgroup_size(256) fn cs(
    @builtin(global_invocation_id) id: vec3u
) {
    let keyword_len = arrayLength(&keyword);
    let key_len = arrayLength(&bitap_key);
    var state = vec4u(0u, 0u, 0u, 0u);

    let end_pos = id.x + keyword_len + 3; // 3 means distance 3
    var dist = 4u;
    var tail_pos = 0u;
    for(var pos = id.x; pos < end_pos; pos++) {
        var mask = 0u;
        for(var i = 0u; i < key_len; i += 2) {
            mask = select(mask, bitap_key[i + 1], bitap_key[i] == data[pos]);
        }

        // calc all next state candidates
        let next_state_candidate = (state << vec4u(1u, 1u, 1u, 1u)) | vec4u(1u, 1u, 1u, 1u);
        let next_state_candidate_mask = next_state_candidate & vec4u(mask, mask, mask, mask);

        let deletion = (next_state_candidate_mask << vec4u(1u, 1u, 1u, 1u)) | vec4u(1u, 1u, 1u, 1u);
        let insertion = state;

        let replace_1 = next_state_candidate[0];
        let replace_2 = next_state_candidate[1];
        let replace_3 = next_state_candidate[2];

        // state update
        state[0] = next_state_candidate_mask[0];
        state[1] = next_state_candidate_mask[1] | replace_1 | insertion[0] | deletion[0];
        state[2] = next_state_candidate_mask[2] | replace_2 | insertion[1] | deletion[1];
        state[3] = next_state_candidate_mask[3] | replace_3 | insertion[2] | deletion[2];

        // mach check
        let matches = (state & end_mask) != vec4u(0u, 0u, 0u, 0u);
        if(any(matches)) {
            let d = select(select(select(3u, 2u, matches[2]), 1u, matches[1]), 0u, matches[0]);
            if(d < dist) {
                tail_pos = pos;
                dist = d;
            }
        }
    }

    if(dist < 4u) {
        let ptr_pos = atomicAdd(&pointer, 1u);
        result[ptr_pos * 2] = tail_pos;
        result[ptr_pos * 2 + 1] = dist;
    }
}
