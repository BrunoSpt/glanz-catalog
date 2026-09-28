import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";

const site = JSON.parse(readFileSync("./src/_data/site.json", "utf8"));
const PORT = 8090;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    // Tests the production build (what GitHub Pages serves), under the real path prefix
    baseURL: `http://localhost:${PORT}${new URL(site.url).pathname}`,
    trace: "retain-on-failure",
  },
  projects: [
    // Safari engine: current iPhone size and the narrowest screen still in use (375px)
    { name: "iphone-17", use: { ...devices["iPhone 17"] } },
    { name: "iphone-narrow", use: { ...devices["iPhone 13 Mini"] } },
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run build && node tests/serve-site.js",
    url: `http://localhost:${PORT}${new URL(site.url).pathname}`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
