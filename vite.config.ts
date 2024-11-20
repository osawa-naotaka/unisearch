import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: './src/main.ts',
      fileName: 'bundle',
      formats: ['es'],
    },
    outDir: './dist',
    emptyOutDir: true,
  },
  plugins: [tsConfigPaths(), dts({ tsconfigPath: './tsconfig.app.json', rollupTypes: true })],
});
