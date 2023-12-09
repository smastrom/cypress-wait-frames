import { defineConfig } from 'cypress'

export default defineConfig({
   component: {
      viewportWidth: 1280,
      viewportHeight: 720,
      experimentalWebKitSupport: true,
      devServer: {
         framework: 'react',
         bundler: 'vite',
      },
   },
})
