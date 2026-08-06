import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    allowedHosts: [
      'mama-anisa-library.com',
      'www.mama-anisa-library.com',
      'localhost'
    ],
    hmr: {
      protocol: 'wss',
      host: 'mama-anisa-library.com',
      clientPort: 443
    }
  }
})