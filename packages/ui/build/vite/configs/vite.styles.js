import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from '../common-config'
import { readDirRecursive } from '../utils.mjs'

const cssInputs = readDirRecursive('./src/styles')
  .filter((el) => ['.css', '.scss']
    .some((elem) => el.includes(elem) && !el.includes('/_')))

export default defineConfig({
  resolve,

  build: {
    outDir: 'dist/styles',

    assetsDir: './',

    rollupOptions: {
      input: [...cssInputs],

      output: {
        assetFileNames: '[name].[ext]',
      },
    },
  },

  plugins: [
    vue(),
  ],
})
