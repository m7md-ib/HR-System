"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(1),
  nameAr: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

function readForm(formData: FormData) {
  return schema.parse({
    name: formData.get("name"),
    nameAr: formData.get("nameAr") || undefined,
    description: formData.get("description") || undefined,
  });
}

export async function createDepartment(formData: FormData) {
  const user = await requirePermission("departments", "create");
  const data = readForm(formData);
  const dept = await db.department.create({ data });
  await logAudit({ userId: user.id, action: "CREATE", entityType: "Department", entityId: dept.id, newValue: data });
  revalidatePath("/departments");
}

export async function updateDepartment(id: string, formData: FormData) {
  const user = await requirePermission("departments", "edit");
  const data = readForm(formData);
  const before = await db.department.findUniqueOrThrow({ where: { id } });
  await db.department.update({ where: { id }, data });
  await logAudit({
    userId: user.id,
    action: "UPDATE",
    entityType: "Department",
    entityId: id,
    oldValue: { name: before.name, nameAr: before.nameAr, description: before.description },
    newValue: data,
  });
  revalidatePath("/departments");
}

export async function deleteDepartment(id: string) {
  const user = await requirePermission("departments", "delete");
  const inUse = await db.employee.count({ where: { departmentId: id } });
  if (inUse > 0) {
    throw new Error("Cannot delete: this department has employees assigned.");
  }
  const before = await db.department.findUniqueOrThrow({ where: { id } });
  await db.department.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "DELETE", entityType: "Department", entityId: id, oldValue: before });
  revalidatePath("/departments");
}
