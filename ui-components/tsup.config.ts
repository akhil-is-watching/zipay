import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@rainbow-me/rainbowkit', 'wagmi', 'viem', '@tanstack/react-query'],
  injectStyle: true,
  loader: {
    '.css': 'css'
  }
});