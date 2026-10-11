import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:3101",
    channel: "msedge",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node tests/ui-server.mjs",
    url: "http://127.0.0.1:3101/api/status",
    reuseExistingServer: false,
    timeout: 20000,
  },
});
