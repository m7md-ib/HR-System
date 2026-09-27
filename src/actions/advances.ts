"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { toPrismaDecimal, money, subtractMoney } from "@/lib/money";
import { appendLedgerEntry } from "@/lib/ledger";

const createSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  amount: z.string().refine((v) => Number(v) > 0, "Amount must be greater than zero"),
  reason: z.string().trim().optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "OTHER"]),
  deductionMethod: z.enum(["FULL", "INSTALLMENTS"]),
  installments: z.string().optional(),
  notes: z.string().trim().optional(),
});

export async function createAdvance(formData: FormData) {
  const user = await requirePermission("advances", "create");
  const data = createSchema.parse({
    employeeId: formData.get("employeeId"),
    date: formData.get("date"),
    amount: formData.get("amount"),
    reason: formData.get("reason") || undefined,
    paymentMethod: formData.get("paymentMethod"),
    deductionMethod: formData.get("deductionMethod"),
    installments: formData.get("installments") || undefined,
    notes: formData.get("notes") || undefined,
  });

  const date = new Date(`${data.date}T00:00:00`);
  const amount = toPrismaDecimal(data.amount);

  const advance = await db.advance.create({
    data: {
      employeeId: data.employeeId,
      date,
      amount,
      reason: data.reason,
      paymentMethod: data.paymentMethod,
      deductionMethod: data.deductionMethod,
      installments: Number(data.installments || 1),
      remainingBalance: amount,
      notes: data.notes,
      createdById: user.id,
      transactions: {
        create: { date, amount, type: "ISSUE" },
      },
    },
  });

  await appendLedgerEntry({
    employeeId: data.employeeId,
    date,
    type: "ADVANCE_ISSUED",
    description: data.reason ? `Advance: ${data.reason}` : "Advance issued",
    debit: data.amount,
    sourceType: "Advance",
    sourceId: advance.id,
  });

  await logAudit({ userId: user.id, action: "CREATE", entityType: "Advance", entityId: advance.id, newValue: { amount: data.amount } });
  revalidatePath("/advances");
  revalidatePath(`/employees/${data.employeeId}`);
}

const deductionSchema = z.object({
  date: z.string().min(1),
  amount: z.string().refine((v) => Number(v) > 0, "Amount must be greater than zero"),
  notes: z.string().trim().optional(),
});

export async function recordAdvanceDeduction(advanceId: string, formData: FormData) {
  const user = await requirePermission("advances", "edit");
  const data = deductionSchema.parse({
    date: formData.get("date"),
    amount: formData.get("amount"),
    notes: formData.get("notes") || undefined,
  });

  const advance = await db.advance.findUniqueOrThrow({ where: { id: advanceId } });
  if (money(data.amount).gt(advance.remainingBalance.toString())) {
    throw new Error("Deduction amount exceeds the remaining advance balance.");
  }

  const date = new Date(`${data.date}T00:00:00`);
  const newRemaining = subtractMoney(advance.remainingBalance.toString(), data.amount);

  await db.$transaction([
    db.advanceTransaction.create({
      data: { advanceId, date, amount: toPrismaDecimal(data.amount), type: "DEDUCTION", notes: data.notes },
    }),
    db.advance.update({
      where: { id: advanceId },
      data: {
        remainingBalance: toPrismaDecimal(newRemaining),
        status: newRemaining.lte(0) ? "SETTLED" : "PARTIALLY_SETTLED",
      },
    }),
  ]);

  await appendLedgerEntry({
    employeeId: advance.employeeId,
    date,
    type: "ADVANCE_DEDUCTION",
    description: "Advance repayment recorded",
    credit: data.amount,
    sourceType: "Advance",
    sourceId: advanceId,
  });

  await logAudit({ userId: user.id, action: "UPDATE", entityType: "Advance", entityId: advanceId, description: `Deduction of ${data.amount}` });
  revalidatePath("/advances");
  revalidatePath(`/employees/${advance.employeeId}`);
}

export async function cancelAdvance(advanceId: string) {
  const user = await requirePermission("advances", "delete");
  const advance = await db.advance.findUniqueOrThrow({ where: { id: advanceId } });
  if (advance.status === "SETTLED") {
    throw new Error("This advance is already settled and cannot be cancelled.");
  }

  await db.advance.update({ where: { id: advanceId }, data: { status: "CANCELLED" } });

  if (money(advance.remainingBalance.toString()).gt(0)) {
    await appendLedgerEntry({
      employeeId: advance.employeeId,
      date: new Date(),
      type: "ADJUSTMENT",
      description: "Advance cancelled — outstanding balance reversed",
      credit: advance.remainingBalance.toString(),
      sourceType: "Advance",
      sourceId: advanceId,
    });
  }

  await logAudit({ userId: user.id, action: "VOID", entityType: "Advance", entityId: advanceId });
  revalidatePath("/advances");
  revalidatePath(`/employees/${advance.employeeId}`);
}
