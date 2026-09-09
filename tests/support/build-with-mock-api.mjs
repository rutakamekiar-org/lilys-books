import { spawn } from "node:child_process";
import path from "node:path";

const apiUrl = "http://127.0.0.1:4100";
const siteUrl = "http://127.0.0.1:3100";
const mockApiPath = path.resolve("tests", "support", "mock-api.mjs");
const nextCli = path.resolve("node_modules", "next", "dist", "bin", "next");

function waitForExit(child, name) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", code => code === 0
      ? resolve()
      : reject(new Error(`${name} exited with code ${code}.`)));
  });
}

async function waitForMockApi(child) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Mock API exited before becoming ready (code ${child.exitCode}).`);
    }

    try {
      const response = await fetch(`${apiUrl}/__health`);
      if (response.ok) return;
    } catch {
      // The local server may still be starting.
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error("Mock API did not become ready within 10 seconds.");
}

async function stop(child) {
  if (child.exitCode !== null || child.killed) return;

  const exited = new Promise(resolve => child.once("exit", resolve));
  child.kill("SIGTERM");
  await Promise.race([
    exited,
    new Promise(resolve => setTimeout(resolve, 2_000)),
  ]);

  if (child.exitCode === null) child.kill("SIGKILL");
}

const mockApi = spawn(process.execPath, [mockApiPath], {
  env: process.env,
  stdio: "inherit",
  windowsHide: true,
});

try {
  await waitForMockApi(mockApi);

  const build = spawn(process.execPath, [nextCli, "build"], {
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: apiUrl,
      NEXT_PUBLIC_SITE_BASE: siteUrl,
      REVALIDATION_SECRET: "deterministic-ci-build",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: "inherit",
    windowsHide: true,
  });

  await waitForExit(build, "Next.js build");
} finally {
  await stop(mockApi);
}
