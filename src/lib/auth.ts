import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MINUTES,
  SESSION_COOKIE,
  SESSION_HOURS,
} from "@/lib/constants";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function tooManyLoginAttempts(email: string, ipAddress: string) {
  const since = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000);
  const failed = await prisma.loginAttempt.count({
    where: {
      createdAt: { gte: since },
      success: false,
      OR: [{ email: email.toLowerCase() }, { ipAddress }],
    },
  });
  return failed >= LOGIN_MAX_ATTEMPTS;
}

export async function recordLoginAttempt(email: string, ipAddress: string, success: boolean) {
  await prisma.loginAttempt.create({
    data: { email: email.toLowerCase(), ipAddress, success },
  });
}

export async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await prisma.adminSession.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress,
      userAgent,
    },
  });
  return { token, expiresAt };
}

export async function destroySession(token: string | undefined) {
  if (!token) return;
  await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function getAdminFromToken(token: string | undefined) {
  if (!token) return null;
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) {
    if (session) await prisma.adminSession.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function getCurrentAdmin() {
  const store = await cookies();
  return getAdminFromToken(store.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}
