import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend talks to the backend via VITE_API_BASE_URL (default :8000).
// CORS is enabled server-side, so no dev proxy is required.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
