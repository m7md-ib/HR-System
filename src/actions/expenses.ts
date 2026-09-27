"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { toPrismaDecimal } from "@/lib/money";
import { appendLedgerEntry } from "@/lib/ledger";
import { notifyRoles } from "@/lib/notify";
import { saveUploadedFile, isUploadableFile } from "@/lib/upload";

const schema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  amount: z.string().refine((v) => Number(v) > 0, "Amount must be greater than zero"),
  expenseType: z.string().trim().min(1),
  reason: z.string().trim().optional(),
  description: z.string().trim().optional(),
  paidBy: z.string().trim().optional(),
  includeInPayroll: z.string().optional(),
  notes: z.string().trim().optional(),
});

export async function createExpense(formData: FormData) {
  const user = await requirePermission("expenses", "create");
  const data = schema.parse({
    employeeId: formData.get("employeeId"),
    date: formData.get("date"),
    amount: formData.get("amount"),
    expenseType: formData.get("expenseType"),
    reason: formData.get("reason") || undefined,
    description: formData.get("description") || undefined,
    paidBy: formData.get("paidBy") || undefined,
    includeInPayroll: formData.get("includeInPayroll") || undefined,
    notes: formData.get("notes") || undefined,
  });

  let receiptUrl: string | undefined;
  const receipt = formData.get("receipt");
  if (isUploadableFile(receipt)) {
    receiptUrl = await saveUploadedFile(receipt, "receipts");
  }

  const expense = await db.employeeExpense.create({
    data: {
      employeeId: data.employeeId,
      date: new Date(`${data.date}T00:00:00`),
      amount: toPrismaDecimal(data.amount),
      expenseType: data.expenseType,
      reason: data.reason,
      description: data.description,
      paidBy: data.paidBy,
      receiptUrl,
      includeInPayroll: data.includeInPayroll === "on",
      notes: data.notes,
      createdById: user.id,
    },
  });
  await logAudit({ userId: user.id, action: "CREATE", entityType: "EmployeeExpense", entityId: expense.id, newValue: { amount: data.amount } });
  await notifyRoles(["ADMIN", "HR_MANAGER", "ACCOUNTANT"], {
    type: "EXPENSE_PENDING",
    title: "New expense pending approval",
    message: `A ${data.amount} JOD expense (${data.expenseType}) needs approval.`,
    relatedEntityType: "EmployeeExpense",
    relatedEntityId: expense.id,
  });
  revalidatePath("/expenses");
  revalidatePath(`/employees/${data.employeeId}`);
}

export async function approveExpense(id: string) {
  const user = await requirePermission("expenses", "approve");
  const expense = await db.employeeExpense.update({
    where: { id },
    data: { approvalStatus: "APPROVED", approvedById: user.id, approvedAt: new Date() },
  });
  await logAudit({ userId: user.id, action: "APPROVE", entityType: "EmployeeExpense", entityId: id });
  revalidatePath("/expenses");
  revalidatePath(`/employees/${expense.employeeId}`);
}

export async function rejectExpense(id: string) {
  const user = await requirePermission("expenses", "approve");
  const expense = await db.employeeExpense.update({
    where: { id },
    data: { approvalStatus: "REJECTED", approvedById: user.id, approvedAt: new Date() },
  });
  await logAudit({ userId: user.id, action: "REJECT", entityType: "EmployeeExpense", entityId: id });
  revalidatePath("/expenses");
  revalidatePath(`/employees/${expense.employeeId}`);
}

/** Marks an approved, "paid separately" (not included in payroll) expense as paid, posting it to the ledger. */
export async function markExpensePaid(id: string) {
  const user = await requirePermission("expenses", "pay");
  const expense = await db.employeeExpense.findUniqueOrThrow({ where: { id } });
  if (expense.approvalStatus !== "APPROVED") {
    throw new Error("Only approved expenses can be marked as paid.");
  }
  if (expense.paymentStatus === "PAID") {
    throw new Error("This expense has already been paid.");
  }

  await db.employeeExpense.update({ where: { id }, data: { paymentStatus: "PAID" } });
  await appendLedgerEntry({
    employeeId: expense.employeeId,
    date: new Date(),
    type: "REIMBURSEMENT",
    description: `Reimbursement: ${expense.expenseType}`,
    credit: expense.amount.toString(),
    sourceType: "EmployeeExpense",
    sourceId: id,
  });
  await logAudit({ userId: user.id, action: "PAY", entityType: "EmployeeExpense", entityId: id });
  revalidatePath("/expenses");
  revalidatePath(`/employees/${expense.employeeId}`);
}
