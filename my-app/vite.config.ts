// vite.config.ts
import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    reactRouter(),
    VitePWA({
      injectRegister: null, // SW 등록 코드 주입 금지
      includeAssets: ["favicon.ico", "icons/*"],
      manifest: false, // public/manifest.webmanifest 사용
      devOptions: { enabled: false }, // 개발 모드 SW 생성 비활성
      filename: "pwa-sw.js", // 혹시 생성돼도 우리 sw.js와 이름 충돌 방지
    }),
  ],
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 4173, strictPort: true },
});
