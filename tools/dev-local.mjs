// Starts the dev server so that server-side fetches to a local backend over HTTPS work.
//
// The ASP.NET Core development certificate is self-signed and trusted through the Windows
// per-user store (`Cert:\CurrentUser\Root`). Browsers read that store, so client-side calls
// succeed; Node.js does not, so every server-side fetch — Server Components such as
// `/books/[slug]`, route handlers, metadata generation — fails with
// `DEPTH_ZERO_SELF_SIGNED_CERT`, surfacing as `TypeError: fetch failed`.
//
// `--use-system-ca` alone is not enough: it does not pick up the per-user store, so the
// certificate is exported and handed to Node through NODE_EXTRA_CA_CERTS. The flag is kept
// as well, for setups whose certificates live in the machine store instead.
//
// Both are passed via NODE_OPTIONS/env so the processes Next.js forks inherit them.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

const CERT_DIR = path.resolve(".certs");
const CERT_PATH = path.join(CERT_DIR, "aspnet-dev-cert.pem");
const CERT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function isFresh(file) {
  if (!existsSync(file)) return false;
  return Date.now() - statSync(file).mtimeMs < CERT_MAX_AGE_MS;
}

/** Exports the ASP.NET Core dev certificate, or returns null with a reason logged. */
function exportDevCertificate() {
  if (isFresh(CERT_PATH)) return CERT_PATH;

  mkdirSync(CERT_DIR, { recursive: true });
  const result = spawnSync("dotnet", ["dev-certs", "https", "--export-path", CERT_PATH, "--format", "PEM"], {
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.status === 0 && existsSync(CERT_PATH)) return CERT_PATH;

  const reason = result.error?.message ?? result.stderr?.trim() ?? result.stdout?.trim() ?? "unknown error";
  console.warn(
    `dev-local: could not export the ASP.NET Core dev certificate (${reason}).\n` +
    "dev-local: server-side HTTPS calls to a local backend may fail. " +
    "Run `dotnet dev-certs https --trust`, or point NEXT_PUBLIC_API_URL at the backend's HTTP endpoint.",
  );
  return null;
}

const certificate = exportDevCertificate();
const env = {
  ...process.env,
  NODE_OPTIONS: [process.env.NODE_OPTIONS, "--use-system-ca"].filter(Boolean).join(" "),
};
if (certificate) {
  env.NODE_EXTRA_CA_CERTS = certificate;
  console.log(`dev-local: trusting ${path.relative(process.cwd(), certificate)} for server-side fetches.`);
}

const nextCli = path.resolve("node_modules", "next", "dist", "bin", "next");
const server = spawn(process.execPath, [nextCli, "dev", "--turbopack", ...process.argv.slice(2)], {
  env,
  stdio: "inherit",
  windowsHide: true,
});

server.once("exit", code => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
