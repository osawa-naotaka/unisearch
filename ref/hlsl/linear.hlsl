// HLSL compute shader (cs_6_0)
// rga -s dx12 --offline -c gfx1150 --cs-entry cs --cs-model cs_6_0 --isa isa.txt --cs linear.hlsl
RWStructuredBuffer<uint> data : register(u0, space0);
RWStructuredBuffer<uint> keyword : register(u1, space0);
RWStructuredBuffer<uint> result : register(u2, space0);
RWStructuredBuffer<uint> pointer : register(u3, space0);

[numthreads(256, 1, 1)]
void cs(uint3 id : SV_DispatchThreadID) {
    uint keyword_len, data_len;
    keyword.GetDimensions(keyword_len);

    for (uint pos = 0; pos < keyword_len; pos++) {
        if (data[id.x + pos] != keyword[pos]) {
            return;
        }
    }

    result[pointer] = id.x;
    pointer = pointer + 1;
}
