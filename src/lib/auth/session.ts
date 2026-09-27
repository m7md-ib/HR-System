import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";

const COOKIE_NAME = "mays_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const hdrs = await headers();

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: hdrs.get("user-agent") ?? undefined,
      ipAddress: hdrs.get("x-forwarded-for") ?? undefined,
    },
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => undefined);
  }
  store.delete(COOKIE_NAME);
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { employee: true } } },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now() || !session.user.isActive) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return session.user;
}
