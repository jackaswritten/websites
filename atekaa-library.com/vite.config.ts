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
    port: 5175,
    strictPort: true,
    allowedHosts: [
      'atekaa-library.com',
      'www.atekaa-library.com',
      'localhost'
    ],
    hmr: {
      protocol: 'wss',
      host: 'atekaa-library.com',
      clientPort: 443
    }
  }
})