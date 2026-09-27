import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// base: './' keeps asset paths relative so the build works on GitHub Pages
// (served from /mike-comeback/) and on any other static host at a root path.
export default defineConfig({
  base: './',
  plugins: [preact()],
});
