// Runs the Playwright e2e suite as several isolated shards at once, like CI's 4-way matrix.
//
// The suite shares one mock API and one Next.js server whose state tests reset, so tests cannot
// share them across workers. Each shard therefore gets its own mock API port, app port and build
// directory. Usage:
//   npm run test:e2e:parallel                      # whole suite, 4 shards
//   npm run test:e2e:parallel -- --shards=6        # more shards
//   npm run test:e2e:parallel -- checkout --grep=@x  # remaining args go to every shard
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const shardArg = args.find(arg => arg.startsWith("--shards="));
const shardCount = Number(shardArg?.split("=")[1] ?? process.env.E2E_SHARDS ?? 4);
const playwrightArgs = args.filter(arg => arg !== shardArg);
if (!Number.isInteger(shardCount) || shardCount < 1) throw new Error(`Invalid shard count: ${shardCount}`);

const root = process.cwd();
const logDir = path.join(root, "test-results", "shards");
mkdirSync(logDir, { recursive: true });

const shards = Array.from({ length: shardCount }, (_, i) => ({
  index: i + 1,
  appPort: 3101 + i,
  apiPort: 4101 + i,
  distDir: `.next-e2e/shard-${i + 1}`,
}));

// Next.js appends each build directory's type globs to the tsconfig it uses. Give the shard builds
// a generated tsconfig that already lists them, so the committed tsconfig.json is never rewritten.
const tsconfigPath = "tsconfig.e2e.json";
const baseTsconfig = JSON.parse(readFileSync(path.join(root, "tsconfig.json"), "utf8"));
writeFileSync(path.join(root, tsconfigPath), `${JSON.stringify({
  extends: "./tsconfig.json",
  include: [
    ...baseTsconfig.include,
    ...shards.flatMap(shard => [`${shard.distDir}/types/**/*.ts`, `${shard.distDir}/dev/types/**/*.ts`]),
  ],
}, null, 2)}\n`);

const playwrightCli = path.join(root, "node_modules", "@playwright", "test", "cli.js");
const started = Date.now();
const children = [];

function runShard(shard) {
  const tag = `[${shard.index}/${shardCount}]`;
  const logPath = path.join(logDir, `shard-${shard.index}.log`);
  const log = createWriteStream(logPath);
  const child = spawn(process.execPath, [
    playwrightCli, "test",
    `--shard=${shard.index}/${shardCount}`,
    `--output=test-results/shards/shard-${shard.index}`,
    "--reporter=line",
    ...playwrightArgs,
  ], {
    env: {
      ...process.env,
      E2E_APP_PORT: String(shard.appPort),
      E2E_API_PORT: String(shard.apiPort),
      E2E_DIST_DIR: shard.distDir,
      E2E_TSCONFIG_PATH: tsconfigPath,
      FORCE_COLOR: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  children.push(child);

  let output = "";
  let pending = "";
  const onData = chunk => {
    const text = chunk.toString();
    output += text;
    log.write(text);
    pending += text;
    const lines = pending.split(/\r?\n/);
    pending = lines.pop();
    for (const line of lines) if (line.trim()) console.log(`${tag} ${line}`);
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);

  return new Promise(resolve => child.once("exit", code => {
    log.end();
    const count = label => Number(output.match(new RegExp(`(\\d+) ${label}`))?.[1] ?? 0);
    resolve({ ...shard, code, logPath, passed: count("passed"), failed: count("failed"), flaky: count("flaky"), skipped: count("skipped") });
  }));
}

const stopAll = () => children.forEach(child => child.exitCode === null && child.kill());
process.once("SIGINT", stopAll);
process.once("SIGTERM", stopAll);

const results = await Promise.all(shards.map(runShard));
const minutes = ((Date.now() - started) / 60_000).toFixed(1);
const total = key => results.reduce((sum, result) => sum + result[key], 0);

console.log(`\nE2E shards finished in ${minutes}m`);
for (const r of results) {
  console.log(`  shard ${r.index}/${shardCount}: ${r.code === 0 ? "ok" : `exit ${r.code}`}, ${r.passed} passed, ${r.failed} failed, ${r.flaky} flaky, ${r.skipped} skipped (${path.relative(root, r.logPath)})`);
}
console.log(`  total: ${total("passed")} passed, ${total("failed")} failed, ${total("flaky")} flaky, ${total("skipped")} skipped`);
process.exit(results.every(r => r.code === 0) ? 0 : 1);
