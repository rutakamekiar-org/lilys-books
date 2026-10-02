import { spawn } from "node:child_process";
import path from "node:path";

const appPort = "3100";
const appHost = "127.0.0.1";
const apiHealthUrl = "http://127.0.0.1:4100/__health";
const nextCli = path.resolve("node_modules", "next", "dist", "bin", "next");

async function waitForMockApi() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(apiHealthUrl);
      if (response.ok) return;
    } catch {
      // The mock server starts alongside this process.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("The local mock API did not become ready.");
}

function runNext(args) {
  return spawn(process.execPath, [nextCli, ...args], {
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolve() : reject(new Error(`Next.js exited with code ${code}.`)));
  });
}

await waitForMockApi();
await waitForExit(runNext(["build"]));

const server = runNext(["start", "--hostname", appHost, "--port", appPort]);
const shutdown = () => {
  if (!server.killed) server.kill();
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
server.once("exit", code => process.exit(code ?? 0));
