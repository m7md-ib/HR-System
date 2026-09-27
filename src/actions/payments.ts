"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { addMoney, money, subtractMoney, toPrismaDecimal } from "@/lib/money";
import { appendLedgerEntry } from "@/lib/ledger";

const schema = z.object({
  employeeId: z.string().min(1),
  payrollRecordId: z.string().optional(),
  amount: z.string().refine((v) => Number(v) > 0, "Amount must be greater than zero"),
  paymentDate: z.string().min(1),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "OTHER"]),
  referenceNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createPayment(formData: FormData) {
  const user = await requirePermission("payments", "create");
  const data = schema.parse({
    employeeId: formData.get("employeeId"),
    payrollRecordId: formData.get("payrollRecordId") || undefined,
    amount: formData.get("amount"),
    paymentDate: formData.get("paymentDate"),
    paymentMethod: formData.get("paymentMethod"),
    referenceNumber: formData.get("referenceNumber") || undefined,
    notes: formData.get("notes") || undefined,
  });

  const paymentDate = new Date(`${data.paymentDate}T00:00:00`);

  await db.$transaction(async (tx) => {
    if (data.payrollRecordId) {
      const record = await tx.payrollRecord.findUniqueOrThrow({ where: { id: data.payrollRecordId } });
      if (money(data.amount).gt(record.remainingAmount.toString())) {
        throw new Error("Payment amount exceeds the remaining amount for this payroll record.");
      }
      await tx.payrollRecord.update({
        where: { id: record.id },
        data: {
          paidAmount: toPrismaDecimal(addMoney(record.paidAmount.toString(), data.amount)),
          remainingAmount: toPrismaDecimal(subtractMoney(record.remainingAmount.toString(), data.amount)),
        },
      });
    }

    await tx.payment.create({
      data: {
        employeeId: data.employeeId,
        payrollRecordId: data.payrollRecordId,
        amount: toPrismaDecimal(data.amount),
        paymentDate,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        createdById: user.id,
      },
    });
  });

  await appendLedgerEntry({
    employeeId: data.employeeId,
    date: paymentDate,
    type: "PAYMENT",
    description: data.referenceNumber ? `Payment (${data.referenceNumber})` : "Payment",
    debit: data.amount,
    sourceType: "Payment",
  });

  await logAudit({ userId: user.id, action: "PAY", entityType: "Payment", entityId: data.employeeId, newValue: { amount: data.amount } });
  revalidatePath("/payments");
  revalidatePath("/payroll");
  revalidatePath(`/employees/${data.employeeId}`);
}

export async function voidPayment(id: string) {
  const user = await requirePermission("payments", "delete");
  const payment = await db.payment.findUniqueOrThrow({ where: { id } });
  if (payment.status === "VOID") {
    throw new Error("This payment is already void.");
  }

  await db.$transaction(async (tx) => {
    if (payment.payrollRecordId) {
      const record = await tx.payrollRecord.findUniqueOrThrow({ where: { id: payment.payrollRecordId } });
      await tx.payrollRecord.update({
        where: { id: record.id },
        data: {
          paidAmount: toPrismaDecimal(subtractMoney(record.paidAmount.toString(), payment.amount.toString())),
          remainingAmount: toPrismaDecimal(addMoney(record.remainingAmount.toString(), payment.amount.toString())),
        },
      });
    }
    await tx.payment.update({ where: { id }, data: { status: "VOID", voidedById: user.id, voidedAt: new Date() } });
  });

  await appendLedgerEntry({
    employeeId: payment.employeeId,
    date: new Date(),
    type: "ADJUSTMENT",
    description: "Payment voided — reversed",
    credit: payment.amount.toString(),
    sourceType: "Payment",
    sourceId: id,
  });

  await logAudit({ userId: user.id, action: "VOID", entityType: "Payment", entityId: id });
  revalidatePath("/payments");
  revalidatePath("/payroll");
  revalidatePath(`/employees/${payment.employeeId}`);
}
