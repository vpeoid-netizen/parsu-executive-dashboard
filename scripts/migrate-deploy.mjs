import { execSync } from "node:child_process";

const attempts = 4;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    process.exit(0);
  } catch {
    if (attempt === attempts) process.exit(1);
    console.warn(`prisma migrate deploy failed (attempt ${attempt}/${attempts}), retrying...`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 8000);
  }
}
