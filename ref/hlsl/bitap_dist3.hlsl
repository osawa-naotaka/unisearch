// HLSL compute shader (cs_6_0)
// rga -s dx12 --offline -c gfx1150 --cs-entry cs --cs-model cs_6_0 --isa isa.txt --cs bitap_dist3.hlsl
StructuredBuffer<uint> data : register(t0);
RWStructuredBuffer<uint> result : register(u1);
RWByteAddressBuffer pointer : register(u2);
cbuffer EndMaskBuffer : register(b3) {
    uint4 end_mask;
};
StructuredBuffer<uint> bitap_dict : register(t4);
cbuffer KeywordLenBuffer : register(b5) {
    uint keyword_len;
};
cbuffer BufferSizeBuffer : register(b6) {
    uint bitap_dict_length;
}

[numthreads(256, 1, 1)]
void cs(uint3 id : SV_DispatchThreadID) {
    const uint4 vec_zero = uint4(0, 0, 0, 0);
    const uint4 vec_one = uint4(1, 1, 1, 1);
    uint4 state = vec_zero;

    uint end_pos = id.x + keyword_len + 3; // 3 means distance 3
    uint dist = 4;
    uint tail_pos = 0;

    for (uint pos = id.x; pos < end_pos; pos++) {
        uint mask = 0;
        for (uint i = 0; i < bitap_dict_length; i += 2) {
            mask = (bitap_dict[i] == data[pos]) ? bitap_dict[i + 1] : mask;
        }

        // calc all next state candidates
        uint4 next_state_candidate = (state << vec_one) | vec_one;
        uint4 next_state_candidate_mask = next_state_candidate & uint4(mask, mask, mask, mask);

        uint4 deletion = (next_state_candidate_mask << vec_one) | vec_one;
        uint4 insertion = state;

        uint replace_1 = next_state_candidate.x;
        uint replace_2 = next_state_candidate.y;
        uint replace_3 = next_state_candidate.z;

        // state update
        state.x = next_state_candidate_mask.x;
        state.y = next_state_candidate_mask.y | replace_1 | insertion.x | deletion.x;
        state.z = next_state_candidate_mask.z | replace_2 | insertion.y | deletion.y;
        state.w = next_state_candidate_mask.w | replace_3 | insertion.z | deletion.z;

        // match check
        bool4 matches = (state & end_mask) != vec_zero;
        if (any(matches)) {
            uint d = matches.z ? 2 : (matches.y ? 1 : (matches.x ? 0 : 3));
            if (d < dist) {
                tail_pos = pos;
                dist = d;
            }
        }
    }

    if (dist < 4) {
        uint ptr_pos = pointer.Load(0);
        pointer.Store(0, ptr_pos + 1);
        result[ptr_pos * 2] = tail_pos;
        result[ptr_pos * 2 + 1] = dist;
    }
}
