import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  build: {
    lib: {
      entry: './src/main.ts',
      fileName: 'staticseek',
      formats: ['es'],
    },
    outDir: './dist',
    emptyOutDir: true,
  },
  plugins: [
    wasm(),
    tsConfigPaths({ projects: ['.'] }),
    dts({ tsconfigPath: './tsconfig.app.json', rollupTypes: true })
  ],
});
