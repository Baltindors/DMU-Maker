import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative asset paths so the same build works on GitHub project pages
// (https://<user>.github.io/<repo>/) without hard-coding the repository name.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react(), tailwindcss()],
}))
