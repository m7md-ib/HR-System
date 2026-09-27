"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

export interface LoginState {
  error?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "invalid_credentials" };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.isActive) {
    return { error: "invalid_credentials" };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "invalid_credentials" };
  }

  await createSession(user.id);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await logAudit({ userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id });

  redirect("/dashboard");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) {
    await logAudit({ userId: user.id, action: "LOGOUT", entityType: "User", entityId: user.id });
  }
  await destroySession();
  redirect("/login");
}
