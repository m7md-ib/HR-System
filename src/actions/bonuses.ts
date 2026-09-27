"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { toPrismaDecimal } from "@/lib/money";

const schema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  type: z.string().trim().min(1),
  amount: z.string().refine((v) => Number(v) > 0, "Amount must be greater than zero"),
  reason: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createBonus(formData: FormData) {
  const user = await requirePermission("bonuses", "create");
  const data = schema.parse({
    employeeId: formData.get("employeeId"),
    date: formData.get("date"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    reason: formData.get("reason") || undefined,
    notes: formData.get("notes") || undefined,
  });

  const bonus = await db.bonus.create({
    data: {
      employeeId: data.employeeId,
      date: new Date(`${data.date}T00:00:00`),
      type: data.type,
      amount: toPrismaDecimal(data.amount),
      reason: data.reason,
      notes: data.notes,
      createdById: user.id,
    },
  });
  await logAudit({ userId: user.id, action: "CREATE", entityType: "Bonus", entityId: bonus.id, newValue: { amount: data.amount } });
  revalidatePath("/bonuses");
  revalidatePath(`/employees/${data.employeeId}`);
}

export async function approveBonus(id: string) {
  const user = await requirePermission("bonuses", "approve");
  const bonus = await db.bonus.update({ where: { id }, data: { approvedById: user.id } });
  await logAudit({ userId: user.id, action: "APPROVE", entityType: "Bonus", entityId: id });
  revalidatePath("/bonuses");
  revalidatePath(`/employees/${bonus.employeeId}`);
}

export async function voidBonus(id: string) {
  const user = await requirePermission("bonuses", "delete");
  const bonus = await db.bonus.findUniqueOrThrow({ where: { id } });
  if (bonus.payrollRecordId) {
    throw new Error("This bonus has already been included in payroll and cannot be voided directly.");
  }
  await db.bonus.update({ where: { id }, data: { status: "VOID" } });
  await logAudit({ userId: user.id, action: "VOID", entityType: "Bonus", entityId: id });
  revalidatePath("/bonuses");
  revalidatePath(`/employees/${bonus.employeeId}`);
}
