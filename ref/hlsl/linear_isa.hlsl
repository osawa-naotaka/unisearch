

; D3D12 Shader Hash 0xd8dfefc1ec5c1a05a890753f0fc0a600
; API PSO Hash 0x30c87da6178cc9cc
; Driver Internal Pipeline Hash 0xd104dc229ea6fb6f
; -------- Disassembly --------------------
shader main
  asic(GFX11_5)
  type(CS)
  sgpr_count(22)
  vgpr_count(4)
  wave_size(64)

  s_version     { version: UC_VERSION_GFX11, w64: 1 }   // 000000000000: B0802006
  s_getpc_b64   s[6:7]                                  // 000000000004: BE864780
  s_set_inst_prefetch_distance  0x0003                  // 000000000008: BF840003
  s_mov_b32     s0, s5                                  // 00000000000C: BE800005
  s_mov_b32     s1, s7                                  // 000000000010: BE810007
  v_mov_b32     v1, 0                                   // 000000000014: 7E020280
  v_and_b32     v0, lit(0x000003ff), v0                 // 000000000018: 360000FF 000003FF
  s_load_b128   s[12:15], s[0:1], null                  // 000000000020: F4080300 F8000000
  s_mov_b32     s5, s7                                  // 000000000028: BE850007
  s_mov_b32     s0, s3                                  // 00000000002C: BE800003
  s_mov_b32     s3, s7                                  // 000000000030: BE830007
  s_mov_b64     s[6:7], exec                            // 000000000034: BE86017E
  s_load_b128   s[16:19], s[4:5], null                  // 000000000038: F4080402 F8000000
  s_load_b128   s[20:23], s[0:1], null                  // 000000000040: F4080500 F8000000
  s_load_b128   s[0:3], s[2:3], null                    // 000000000048: F4080001 F8000000
  s_mov_b64     s[4:5], exec                            // 000000000050: BE84017E
                                                        s_delay_alu  instid0(INSTID_VALU_DEP_1) // 000000000054: BF870001
  v_lshl_add_u32  v0, s8, 8, v0                         // 000000000058: D6460000 04011008
  s_movk_i32    s8, 0x0000                              // 000000000060: B0080000
  s_waitcnt     lgkmcnt(0)                              // 000000000064: BF89FC07
  buffer_load_b32  v2, v1, s[12:15], 0 idxen            // 000000000068: E0500000 80830201
  s_waitcnt     vmcnt(0)                                // 000000000070: BF8903F7
  s_nop         0x0000                                  // 000000000074: BF800000
  s_nop         0x0000                                  // 000000000078: BF800000
  s_nop         0x0000                                  // 00000000007C: BF800000
label_0080:
  v_add_nc_u32  v1, s8, v0                              // 000000000080: 4A020008
  v_mov_b32     v3, s8                                  // 000000000084: 7E060208
  buffer_load_b32  v1, v1, s[0:3], 0 idxen              // 000000000088: E0500000 80800101
  buffer_load_b32  v3, v3, s[20:23], 0 idxen            // 000000000090: E0500000 80850303
  s_waitcnt     vmcnt(0)                                // 000000000098: BF8903F7
  v_cmp_eq_i32  vcc, v1, v3                             // 00000000009C: 7C840701
  s_and_not0_saveexec_b64  s[10:11], vcc                // 0000000000A0: BE8A2D6A
  s_and_not1_b64  s[6:7], s[6:7], exec                  // 0000000000A4: 91867E06
  s_cbranch_scc0  label_00E0                            // 0000000000A8: BFA1000D
  s_and_b64     exec, s[10:11], s[6:7]                  // 0000000000AC: 8BFE060A
  s_add_u32     s8, s8, 1                               // 0000000000B0: 80088108
                                                        s_delay_alu  instid0(INSTID_SALU_CYCLE_1) // 0000000000B4: BF870009
  s_cmp_lt_u32  s8, 16                                  // 0000000000B8: BF0A9008
  s_cbranch_scc1  label_0080                            // 0000000000BC: BFA2FFF0
  v_add_nc_u32  v1, 1, v2                               // 0000000000C0: 4A020481
  v_mov_b32     v3, 0                                   // 0000000000C4: 7E060280
  buffer_store_b32  v0, v2, s[16:19], 0 idxen glc       // 0000000000C8: E0684000 80840002
  buffer_store_b32  v1, v3, s[12:15], 0 idxen glc       // 0000000000D0: E0684000 80830103
  s_branch      label_00E0                              // 0000000000D8: BFA00001
  s_branch      label_0080                              // 0000000000DC: BFA0FFE8
label_00E0:
  s_sendmsg     sendmsg(MSG_DEALLOC_VGPRS, 0, 0)        // 0000000000E0: BFB60003
  s_endpgm                                              // 0000000000E4: BFB00000
  s_code_end                                            // 0000000000E8: BF9F0000
  s_code_end                                            // 0000000000EC: BF9F0000
  s_code_end                                            // 0000000000F0: BF9F0000
  s_code_end                                            // 0000000000F4: BF9F0000
  s_code_end                                            // 0000000000F8: BF9F0000
  s_code_end                                            // 0000000000FC: BF9F0000
  s_code_end                                            // 000000000100: BF9F0000
  s_code_end                                            // 000000000104: BF9F0000
  s_code_end                                            // 000000000108: BF9F0000
  s_code_end                                            // 00000000010C: BF9F0000
  s_code_end                                            // 000000000110: BF9F0000
  s_code_end                                            // 000000000114: BF9F0000
  s_code_end                                            // 000000000118: BF9F0000
  s_code_end                                            // 00000000011C: BF9F0000
  s_code_end                                            // 000000000120: BF9F0000
  s_code_end                                            // 000000000124: BF9F0000
  s_code_end                                            // 000000000128: BF9F0000
  s_code_end                                            // 00000000012C: BF9F0000
  s_code_end                                            // 000000000130: BF9F0000
  s_code_end                                            // 000000000134: BF9F0000
  s_code_end                                            // 000000000138: BF9F0000
  s_code_end                                            // 00000000013C: BF9F0000
  s_code_end                                            // 000000000140: BF9F0000
  s_code_end                                            // 000000000144: BF9F0000
  s_code_end                                            // 000000000148: BF9F0000
  s_code_end                                            // 00000000014C: BF9F0000
  s_code_end                                            // 000000000150: BF9F0000
  s_code_end                                            // 000000000154: BF9F0000
  s_code_end                                            // 000000000158: BF9F0000
  s_code_end                                            // 00000000015C: BF9F0000
  s_code_end                                            // 000000000160: BF9F0000
  s_code_end                                            // 000000000164: BF9F0000
  s_code_end                                            // 000000000168: BF9F0000
  s_code_end                                            // 00000000016C: BF9F0000
  s_code_end                                            // 000000000170: BF9F0000
  s_code_end                                            // 000000000174: BF9F0000
  s_code_end                                            // 000000000178: BF9F0000
  s_code_end                                            // 00000000017C: BF9F0000
  s_code_end                                            // 000000000180: BF9F0000
  s_code_end                                            // 000000000184: BF9F0000
  s_code_end                                            // 000000000188: BF9F0000
  s_code_end                                            // 00000000018C: BF9F0000
  s_code_end                                            // 000000000190: BF9F0000
  s_code_end                                            // 000000000194: BF9F0000
  s_code_end                                            // 000000000198: BF9F0000
  s_code_end                                            // 00000000019C: BF9F0000
  s_code_end                                            // 0000000001A0: BF9F0000
  s_code_end                                            // 0000000001A4: BF9F0000
  s_code_end                                            // 0000000001A8: BF9F0000
  s_code_end                                            // 0000000001AC: BF9F0000
  s_code_end                                            // 0000000001B0: BF9F0000
  s_code_end                                            // 0000000001B4: BF9F0000
  s_code_end                                            // 0000000001B8: BF9F0000
  s_code_end                                            // 0000000001BC: BF9F0000
  s_code_end                                            // 0000000001C0: BF9F0000
  s_code_end                                            // 0000000001C4: BF9F0000
  s_code_end                                            // 0000000001C8: BF9F0000
  s_code_end                                            // 0000000001CC: BF9F0000
  s_code_end                                            // 0000000001D0: BF9F0000
  s_code_end                                            // 0000000001D4: BF9F0000
  s_code_end                                            // 0000000001D8: BF9F0000
  s_code_end                                            // 0000000001DC: BF9F0000
  s_code_end                                            // 0000000001E0: BF9F0000
  s_code_end                                            // 0000000001E4: BF9F0000
end

