"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";

const ROLES = ["ADMIN", "HR_MANAGER", "HR_EMPLOYEE", "ACCOUNTANT", "MANAGER", "EMPLOYEE"] as const;

const createSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1),
  role: z.enum(ROLES),
  employeeId: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function createUser(formData: FormData) {
  const admin = await requirePermission("users", "create");
  const data = createSchema.parse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
    employeeId: formData.get("employeeId") || undefined,
    password: formData.get("password"),
  });

  const existing = await db.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const user = await db.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role,
      employeeId: data.employeeId || null,
      passwordHash: await hashPassword(data.password),
    },
  });
  await logAudit({ userId: admin.id, action: "CREATE", entityType: "User", entityId: user.id, newValue: { email: user.email, role: user.role } });
  revalidatePath("/users");
}

const updateSchema = z.object({
  name: z.string().trim().min(1),
  role: z.enum(ROLES),
  employeeId: z.string().optional(),
  password: z.string().optional(),
});

export async function updateUser(id: string, formData: FormData) {
  const admin = await requirePermission("users", "edit");
  const data = updateSchema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
    employeeId: formData.get("employeeId") || undefined,
    password: formData.get("password") || undefined,
  });

  if (data.password && data.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  await db.user.update({
    where: { id },
    data: {
      name: data.name,
      role: data.role,
      employeeId: data.employeeId || null,
      ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
    },
  });
  await logAudit({ userId: admin.id, action: "UPDATE", entityType: "User", entityId: id, newValue: { role: data.role } });
  revalidatePath("/users");
}

export async function toggleUserActive(id: string) {
  const admin = await requirePermission("users", "edit");
  const target = await db.user.findUniqueOrThrow({ where: { id } });
  if (target.id === admin.id) {
    throw new Error("You cannot disable your own account.");
  }
  await db.user.update({ where: { id }, data: { isActive: !target.isActive } });
  await logAudit({ userId: admin.id, action: "UPDATE", entityType: "User", entityId: id, description: target.isActive ? "Disabled" : "Enabled" });
  revalidatePath("/users");
}
