type BitapKey = {
    mask: Map<string, number>;
    length: number;
};

export function createBitapKey(pattern: string): BitapKey {
    if (pattern.length > 32) throw new Error("createBitapKey: key length must be less than 32.");
    const key: BitapKey = {
        mask: new Map<string, number>(),
        length: pattern.length,
    };

    for (let i = 0; i < key.length; i++) {
        const char = pattern[i];
        const bit = 1 << i;
        const old = key.mask.get(char);

        if (!old) {
            key.mask.set(char, bit);
        } else {
            key.mask.set(char, old | bit);
        }
    }

    return key;
}

export function bitapSearch(key: BitapKey, maxErrors: number, text: string, pos = 0): number | null {
    const state = Array(maxErrors + 1).fill(0);
    const matchbit = 1 << (key.length - 1);

    for (let i = pos; i < text.length; i++) {
        const mask = key.mask.get(text[i]) || 0;
        let replace = 0;
        let insertion = 0;
        let deletion = 0;

        for (let distance = 0; distance < maxErrors + 1; distance++) {
            const next_state_candidate = (state[distance] << 1) | 1;
            const next_state = (next_state_candidate & mask) | replace | insertion | deletion;

            replace = next_state_candidate;
            insertion = state[distance];
            deletion = next_state;

            state[distance] = next_state;

            if ((state[distance] & matchbit) !== 0) {
                return i - key.length + 1;
            }
        }
    }

    return null;
}
