@group(0) @binding(0) var<storage, read> data: array<u32>;
@group(0) @binding(1) var<storage, read> keyword: array<u32>;
@group(0) @binding(2) var<storage, read_write> result: array<u32>;
@group(0) @binding(3) var<storage, read_write> pointer: atomic<u32>;
@group(0) @binding(5) var<storage, read> bitap_key: array<u32>;
@group(0) @binding(8) var<uniform> end_mask: vec2u;


@compute @workgroup_size(256) fn cs(
    @builtin(global_invocation_id) id: vec3u
) {
    let keyword_len = arrayLength(&keyword);
    var state = vec2u(0u, 0u);

    var dist = 4u;
    var tail_pos = 0u;

    var mask = 0u;

    // ア
    var pos = id.x;
    mask = select(0u,   bitap_key[1], bitap_key[0] == data[pos]);
    mask = select(mask, bitap_key[3], bitap_key[2] == data[pos]);
    mask = select(mask, bitap_key[5], bitap_key[4] == data[pos]);
    mask = select(mask, bitap_key[7], bitap_key[6] == data[pos]);
    mask = select(mask, bitap_key[9], bitap_key[8] == data[pos]);

    var next_state_candidate = (state << vec2u(1u, 1u)) | vec2u(1u, 1u);
    var next_state_candidate_mask = next_state_candidate & vec2u(mask, mask);

    var deletion = (next_state_candidate_mask << vec2u(1u, 1u)) | vec2u(1u, 1u);
    var insertion = state;

    var replace_1 = next_state_candidate[0];
    state[0] = next_state_candidate_mask[0];
    state[1] = next_state_candidate_mask[1] | replace_1 | insertion[0] | deletion[0];

    // ad-hock return: must be fixed.
    if (mask == 0u) {
        return ;
    }

    // ン
    pos++;
    mask = select(0u,   bitap_key[1], bitap_key[0] == data[pos]);
    mask = select(mask, bitap_key[3], bitap_key[2] == data[pos]);
    mask = select(mask, bitap_key[5], bitap_key[4] == data[pos]);
    mask = select(mask, bitap_key[7], bitap_key[6] == data[pos]);
    mask = select(mask, bitap_key[9], bitap_key[8] == data[pos]);

    next_state_candidate = (state << vec2u(1u, 1u)) | vec2u(1u, 1u);
    next_state_candidate_mask = next_state_candidate & vec2u(mask, mask);

    deletion = (next_state_candidate_mask << vec2u(1u, 1u)) | vec2u(1u, 1u);
    insertion = state;

    replace_1 = next_state_candidate[0];
    state[0] = next_state_candidate_mask[0];
    state[1] = next_state_candidate_mask[1] | replace_1 | insertion[0] | deletion[0];

    // パ
    pos++;
    mask = select(0u,   bitap_key[1], bitap_key[0] == data[pos]);
    mask = select(mask, bitap_key[3], bitap_key[2] == data[pos]);
    mask = select(mask, bitap_key[5], bitap_key[4] == data[pos]);
    mask = select(mask, bitap_key[7], bitap_key[6] == data[pos]);
    mask = select(mask, bitap_key[9], bitap_key[8] == data[pos]);

    next_state_candidate = (state << vec2u(1u, 1u)) | vec2u(1u, 1u);
    next_state_candidate_mask = next_state_candidate & vec2u(mask, mask);

    deletion = (next_state_candidate_mask << vec2u(1u, 1u)) | vec2u(1u, 1u);
    insertion = state;

    replace_1 = next_state_candidate[0];
    state[0] = next_state_candidate_mask[0];
    state[1] = next_state_candidate_mask[1] | replace_1 | insertion[0] | deletion[0];

    // サ
    pos++;
    mask = select(0u,   bitap_key[1], bitap_key[0] == data[pos]);
    mask = select(mask, bitap_key[3], bitap_key[2] == data[pos]);
    mask = select(mask, bitap_key[5], bitap_key[4] == data[pos]);
    mask = select(mask, bitap_key[7], bitap_key[6] == data[pos]);
    mask = select(mask, bitap_key[9], bitap_key[8] == data[pos]);

    next_state_candidate = (state << vec2u(1u, 1u)) | vec2u(1u, 1u);
    next_state_candidate_mask = next_state_candidate & vec2u(mask, mask);

    deletion = (next_state_candidate_mask << vec2u(1u, 1u)) | vec2u(1u, 1u);
    insertion = state;

    replace_1 = next_state_candidate[0];
    state[0] = next_state_candidate_mask[0];
    state[1] = next_state_candidate_mask[1] | replace_1 | insertion[0] | deletion[0];

    // ン
    pos++;
    mask = select(0u,   bitap_key[1], bitap_key[0] == data[pos]);
    mask = select(mask, bitap_key[3], bitap_key[2] == data[pos]);
    mask = select(mask, bitap_key[5], bitap_key[4] == data[pos]);
    mask = select(mask, bitap_key[7], bitap_key[6] == data[pos]);
    mask = select(mask, bitap_key[9], bitap_key[8] == data[pos]);

    next_state_candidate = (state << vec2u(1u, 1u)) | vec2u(1u, 1u);
    next_state_candidate_mask = next_state_candidate & vec2u(mask, mask);

    deletion = (next_state_candidate_mask << vec2u(1u, 1u)) | vec2u(1u, 1u);
    insertion = state;

    replace_1 = next_state_candidate[0];
    state[0] = next_state_candidate_mask[0];
    state[1] = next_state_candidate_mask[1] | replace_1 | insertion[0] | deletion[0];

    var matches = (state & end_mask) != vec2u(0u, 0u);
    if(any(matches)) {
        let d = select(1u, 0u, matches[0]);
        if(d < dist) {
            tail_pos = id.x + 0;
            dist = d;
        }
    }

    // ド
    pos++;
    mask = select(0u,   bitap_key[1], bitap_key[0] == data[pos]);
    mask = select(mask, bitap_key[3], bitap_key[2] == data[pos]);
    mask = select(mask, bitap_key[5], bitap_key[4] == data[pos]);
    mask = select(mask, bitap_key[7], bitap_key[6] == data[pos]);
    mask = select(mask, bitap_key[9], bitap_key[8] == data[pos]);

    next_state_candidate = (state << vec2u(1u, 1u)) | vec2u(1u, 1u);
    next_state_candidate_mask = next_state_candidate & vec2u(mask, mask);

    deletion = (next_state_candidate_mask << vec2u(1u, 1u)) | vec2u(1u, 1u);
    insertion = state;

    replace_1 = next_state_candidate[0];
    state[0] = next_state_candidate_mask[0];
    state[1] = next_state_candidate_mask[1] | replace_1 | insertion[0] | deletion[0];

    matches = (state & end_mask) != vec2u(0u, 0u);
    if(any(matches)) {
        let d = select(1u, 0u, matches[0]);
        if(d < dist) {
            tail_pos = id.x + 0;
            dist = d;
        }
    }

    // additional
    pos++;
    mask = select(0u,   bitap_key[1], bitap_key[0] == data[pos]);
    mask = select(mask, bitap_key[3], bitap_key[2] == data[pos]);
    mask = select(mask, bitap_key[5], bitap_key[4] == data[pos]);
    mask = select(mask, bitap_key[7], bitap_key[6] == data[pos]);
    mask = select(mask, bitap_key[9], bitap_key[8] == data[pos]);

    next_state_candidate = (state << vec2u(1u, 1u)) | vec2u(1u, 1u);
    next_state_candidate_mask = next_state_candidate & vec2u(mask, mask);

    deletion = (next_state_candidate_mask << vec2u(1u, 1u)) | vec2u(1u, 1u);
    insertion = state;

    replace_1 = next_state_candidate[0];
    state[0] = next_state_candidate_mask[0];
    state[1] = next_state_candidate_mask[1] | replace_1 | insertion[0] | deletion[0];

    matches = (state & end_mask) != vec2u(0u, 0u);
    if(matches[1]) {
        let d = select(1u, 0u, matches[0]);
        if(d < dist) {
            tail_pos = id.x + 0;
            dist = d;
        }
    }


    // push result
    if(dist < 4u) {
        let ptr_pos = atomicAdd(&pointer, 1u);
        result[ptr_pos * 2] = tail_pos;
        result[ptr_pos * 2 + 1] = dist;
    }
}
