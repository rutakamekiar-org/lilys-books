// Starts the dev server with Node trusting the operating system certificate store.
//
// Browsers read the OS store, so client-side fetches to a local backend over HTTPS work as
// soon as `dotnet dev-certs https --trust` has been run. Node does not: it ships its own CA
// list, so every server-side fetch (Server Components such as `/books/[slug]`, route
// handlers, metadata generation) fails with `self-signed certificate` instead.
//
// NODE_OPTIONS rather than a direct flag, so the processes Next.js forks inherit it too.
import { spawn } from "node:child_process";
import path from "node:path";

const nextCli = path.resolve("node_modules", "next", "dist", "bin", "next");
const nodeOptions = [process.env.NODE_OPTIONS, "--use-system-ca"].filter(Boolean).join(" ");

const server = spawn(process.execPath, [nextCli, "dev", "--turbopack", ...process.argv.slice(2)], {
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
  stdio: "inherit",
  windowsHide: true,
});

server.once("exit", code => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
