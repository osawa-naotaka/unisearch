#!/bin/sh

rustup default stable
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
~/.cargo/bin/wasm-pack build --target bundler
