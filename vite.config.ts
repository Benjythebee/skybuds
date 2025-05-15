import { defineConfig } from 'vite'
import { resolve } from "path";
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
    build:{
    target:'esnext',
    rollupOptions:{
      input: resolve(__dirname, 'index.html'),
    },
    outDir:'./dist'
  }
})