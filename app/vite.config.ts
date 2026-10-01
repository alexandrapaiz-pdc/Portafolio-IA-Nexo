import path from "node:path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

// Builds one self-contained HTML file (JS, CSS and images inlined) so it can be
// published as a Claude artifact today and served as a static site later.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: { assetsInlineLimit: 100_000_000, cssCodeSplit: false },
})
