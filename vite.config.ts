import { defineConfig } from 'vite'

export default defineConfig({
   build: {
      lib: {
         entry: 'src/index.ts',
         name: 'CypressWaitFrames',
         formats: ['es', 'cjs'],
         fileName: 'index',
      },
   },
})
