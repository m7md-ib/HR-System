"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { toPrismaDecimal } from "@/lib/money";

const DEDUCTION_TYPES = ["ABSENCE", "LATE", "SALARY_DEDUCTION", "ADVANCE_DEDUCTION", "DAMAGE", "OTHER"] as const;

const schema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  type: z.enum(DEDUCTION_TYPES),
  amount: z.string().refine((v) => Number(v) > 0, "Amount must be greater than zero"),
  reason: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createDeduction(formData: FormData) {
  const user = await requirePermission("deductions", "create");
  const data = schema.parse({
    employeeId: formData.get("employeeId"),
    date: formData.get("date"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    reason: formData.get("reason") || undefined,
    notes: formData.get("notes") || undefined,
  });

  const deduction = await db.deduction.create({
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
  await logAudit({ userId: user.id, action: "CREATE", entityType: "Deduction", entityId: deduction.id, newValue: { amount: data.amount, type: data.type } });
  revalidatePath("/deductions");
  revalidatePath(`/employees/${data.employeeId}`);
}

export async function approveDeduction(id: string) {
  const user = await requirePermission("deductions", "approve");
  const deduction = await db.deduction.update({ where: { id }, data: { approvedById: user.id } });
  await logAudit({ userId: user.id, action: "APPROVE", entityType: "Deduction", entityId: id });
  revalidatePath("/deductions");
  revalidatePath(`/employees/${deduction.employeeId}`);
}

export async function voidDeduction(id: string) {
  const user = await requirePermission("deductions", "delete");
  const deduction = await db.deduction.findUniqueOrThrow({ where: { id } });
  if (deduction.payrollRecordId) {
    throw new Error("This deduction has already been included in payroll and cannot be voided directly.");
  }
  await db.deduction.update({ where: { id }, data: { status: "VOID" } });
  await logAudit({ userId: user.id, action: "VOID", entityType: "Deduction", entityId: id });
  revalidatePath("/deductions");
  revalidatePath(`/employees/${deduction.employeeId}`);
}
