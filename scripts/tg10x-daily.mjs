/**
 * Scheduled daily run: spawns the main script with POST_ONLY=1 (skip profile).
 * Default HEADLESS=1 for unattended tasks; set HEADLESS=0 in .env if login fails.
 */
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(root, "scripts", "tg10x-automation.mjs");

const env = {
  ...process.env,
  POST_ONLY: process.env.POST_ONLY ?? "1",
  HEADLESS: process.env.HEADLESS ?? "1",
};

const child = spawn(process.execPath, [script], {
  cwd: root,
  env,
  stdio: "inherit",
});

await new Promise((resolve, reject) => {
  child.on("exit", (code) =>
    code === 0 ? resolve() : reject(new Error(`tg10x exited with code ${code}`))
  );
  child.on("error", reject);
});
