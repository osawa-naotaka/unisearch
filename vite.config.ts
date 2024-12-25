import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  build: {
    lib: {
      entry: './src/main.ts',
      fileName: 'unisearch',
      formats: ['es'],
    },
    outDir: './dist',
    emptyOutDir: true,
    minify: "terser",
    terserOptions: {
      keep_classnames: true,
    },
  },
  plugins: [
    wasm(),
    tsConfigPaths(),
    dts({ tsconfigPath: './tsconfig.app.json', rollupTypes: true })
  ],
});
