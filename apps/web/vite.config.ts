import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (mode === "production" && !env.VITE_SERVER_URL?.trim()) {
    throw new Error("Missing VITE_SERVER_URL: set it to the deployed server URL (for example wss://sevens-server.onrender.com) before building the production web app.");
  }

  return {
    plugins: [react(), tailwindcss()],
  };
});
