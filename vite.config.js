import dns from "node:dns";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

dns.setDefaultResultOrder("verbatim");

export default defineConfig({
  plugins: [tailwindcss()],
  test: {
    environment: "node",
  },
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "localhost",
      clientPort: 5173,
    },
  },
});
