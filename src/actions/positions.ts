"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  title: z.string().trim().min(1),
  titleAr: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

function readForm(formData: FormData) {
  return schema.parse({
    title: formData.get("title"),
    titleAr: formData.get("titleAr") || undefined,
    departmentId: formData.get("departmentId") || undefined,
    description: formData.get("description") || undefined,
  });
}

export async function createPosition(formData: FormData) {
  const user = await requirePermission("positions", "create");
  const data = readForm(formData);
  const position = await db.position.create({ data });
  await logAudit({ userId: user.id, action: "CREATE", entityType: "Position", entityId: position.id, newValue: data });
  revalidatePath("/positions");
}

export async function updatePosition(id: string, formData: FormData) {
  const user = await requirePermission("positions", "edit");
  const data = readForm(formData);
  const before = await db.position.findUniqueOrThrow({ where: { id } });
  await db.position.update({ where: { id }, data });
  await logAudit({
    userId: user.id,
    action: "UPDATE",
    entityType: "Position",
    entityId: id,
    oldValue: { title: before.title, titleAr: before.titleAr, departmentId: before.departmentId },
    newValue: data,
  });
  revalidatePath("/positions");
}

export async function deletePosition(id: string) {
  const user = await requirePermission("positions", "delete");
  const inUse = await db.employee.count({ where: { positionId: id } });
  if (inUse > 0) {
    throw new Error("Cannot delete: this position has employees assigned.");
  }
  const before = await db.position.findUniqueOrThrow({ where: { id } });
  await db.position.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "DELETE", entityType: "Position", entityId: id, oldValue: before });
  revalidatePath("/positions");
}
