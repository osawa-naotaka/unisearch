@group(0) @binding(0) var<storage, read> data: array<u32>;
@group(0) @binding(1) var<storage, read> keyword: array<u32>;
@group(0) @binding(2) var<storage, read_write> result: array<u32>;
@group(0) @binding(3) var<storage, read_write> pointer: atomic<u32>;
@group(0) @binding(4) var<storage, read> start_pos: array<u32>;
@group(0) @binding(5) var<storage, read> bitap_key: array<u32>;

@compute @workgroup_size(100) fn cs(
    @builtin(global_invocation_id) id: vec3u
) {
    if(id.x >= arrayLength(&start_pos)) {
        return ;
    }
    let keyword_len = arrayLength(&keyword);
    let end_pos = start_pos[id.x + 1u];
    let key_len = arrayLength(&bitap_key);
    let match_bit = 1u << ((key_len >> 1u) - 1u);
    var state: array<u32, 4>;
    for(var i = 0u; i < 4u; i++) {
        state[i] = 0;
    }
    for(var data_pos = start_pos[id.x]; data_pos < end_pos; data_pos++) {
        var mask = 0u;
        for(var i = 0u; i < key_len; i += 2) {
            mask = select(mask, bitap_key[i + 1], bitap_key[i] == data[data_pos]);
        }

        var replace = 0u;
        var insertion = 0u;
        var deletion = 0u;

        for(var distance = 0u; distance < 2; distance++) {
            let next_state_candidate = (state[distance] << 1u) | 1u;
            var next_state = (next_state_candidate & mask) | replace | insertion | deletion;

            replace = next_state_candidate;
            insertion = state[distance];
            deletion = next_state;

            state[distance] = next_state;

            if((state[distance] & match_bit) != 0u) {
                let ptr_pos = atomicAdd(&pointer, 1u);
                result[ptr_pos * 2] = id.x;
                result[ptr_pos * 2 + 1] = data_pos - (key_len >> 1u) + 1 - start_pos[id.x];

                for(var i = 0u; i < 4u; i++) {
                    state[i] = 0;
                }
                break; 
            }
        }
    }
}
