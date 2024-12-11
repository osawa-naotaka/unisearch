use wasm_bindgen::prelude::*;
use std::collections::HashMap;

#[wasm_bindgen]
pub struct StringManager {
    storage: HashMap<i32, String>,
    next_id: i32,
    keyword: String,
    max_edit_distance: usize,
}

#[wasm_bindgen]
impl StringManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> StringManager {
        StringManager {
            storage: HashMap::new(),
            next_id: 0,
            keyword: String::new(),
            max_edit_distance: 1,
        }
    }

    pub fn register(&mut self, key_id: i32, value: &str) -> i32 {
        if let Some(existing_value) = self.storage.get_mut(&key_id) {
            existing_value.push_str(value);
            key_id
        } else {
            let id = if key_id >= 0 { key_id } else { self.next_id };
            self.storage.insert(id, value.to_string());
            if key_id < 0 {
                self.next_id += 1;
            }
            id
        }
    }

    pub fn register_keyword(&mut self, key: &str) {
        self.keyword = key.to_string()
    }

    pub fn set_max_edit_distance(&mut self, distance: usize) {
        self.max_edit_distance = distance;
    }

    pub fn find_all(&self, target_id: i32) -> Vec<i32> {
        let target = match self.storage.get(&target_id) {
            Some(value) => value,
            None => return vec![],
        };
        self.bitap_fuzzy_search(target)
    }

    fn bitap_fuzzy_search(&self, text: &str) -> Vec<i32> {
        let keyword = &self.keyword;
        let max_distance = self.max_edit_distance;

        if keyword.is_empty() {
            return vec![];
        }

        let match_bit = (1 as u32) << (keyword.chars().count() - 1);

        let mut bit_mask: HashMap<char, u32> = HashMap::new();
        for (i, ch) in keyword.chars().enumerate() {
            let mask = bit_mask.entry(ch).or_insert(0);
            *mask |= 1 << i;
        }

        let mut matches = Vec::new();
        let mut state = vec![0 as u32; max_distance + 1];

        for (text_idx, text_char) in text.chars().enumerate(){
            let mask = match bit_mask.get(&text_char) {
                Some(x) => x,
                None => &0,
            };
            let next_state_candidate = (state[0] << 1) | 1;
            let next_state = next_state_candidate & mask;
            state[0] = next_state;

            if (match_bit & state[0]) != 0 {
                matches.push(text_idx as i32);
            }
        }
        matches
    }

    pub fn size(&mut self) -> i32 {
        self.storage.len() as i32
    }
}
