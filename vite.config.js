import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.API_TOKEN": JSON.stringify(env.API_TOKEN || ""),
    },
  };
});
