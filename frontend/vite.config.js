import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "^/api(?:/|$)": {
        target: "http://127.0.0.1:5000",
        configure(proxy) {
          proxy.on("proxyReq", (proxyReq, req) => {
            // Same-origin browser requests reach Express through Vite.
            if (req.headers.origin === `http://${req.headers.host}`) {
              proxyReq.removeHeader("origin");
            }
          });
        },
      },
    },
  },
});
