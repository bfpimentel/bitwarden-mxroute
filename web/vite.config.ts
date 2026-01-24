import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const serverAddress =
    process.env.SERVER_ADDRESS || env.SERVER_ADDRESS || "http://127.0.0.1:6123";

  return {
    plugins: [react()],
    server: {
      port: 6124,
      host: true,
      proxy: {
        "/api": {
          target: serverAddress,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
