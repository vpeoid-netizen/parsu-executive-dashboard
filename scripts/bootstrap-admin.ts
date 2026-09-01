import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
  }
}

async function main() {
  loadEnv();
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set.");
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, active: true, role: "ADMIN" },
    create: {
      email,
      name: "Dashboard Administrator",
      role: "ADMIN",
      passwordHash,
    },
  });
  console.log(`Administrator ready: ${user.email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
