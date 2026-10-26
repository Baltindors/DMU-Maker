import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Relative asset paths so the same build works on GitHub project pages
// (https://<user>.github.io/<repo>/) without hard-coding the repository name.
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL?.trim()

  return {
    base: command === 'build' ? './' : '/',
    plugins: [react(), tailwindcss()],
    server: apiBaseUrl
      ? {
          proxy: {
            '/client': {
              target: apiBaseUrl,
              changeOrigin: true,
            },
          },
        }
      : undefined,
  }
})
