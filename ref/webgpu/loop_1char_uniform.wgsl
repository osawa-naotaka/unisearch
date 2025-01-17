@group(0) @binding(0) var<storage, read> data: array<u32>;
@group(0) @binding(2) var<storage, read_write> result: array<u32>;
@group(0) @binding(3) var<storage, read_write> pointer: atomic<u32>;
@group(0) @binding(6) var<uniform> keyword: vec4u;
@group(0) @binding(7) var<uniform> loop_cnt: u32;

@compute @workgroup_size(256) fn cs(
    @builtin(global_invocation_id) id: vec3u
) {
    let start = id.x * loop_cnt;
    for(var i = 0u; i < loop_cnt; i++) {
        let cmp = keyword[0] == data[start + i];

        if(cmp) {
            let ptr_pos = atomicAdd(&pointer, 1u);
            result[ptr_pos] = start + i;
        }
    }
}
