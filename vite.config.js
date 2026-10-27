import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{
            name: 'three-vendor',
            test: /node_modules[\\/]three[\\/]/
          }]
        }
      }
    }
  }
});
