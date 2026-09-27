"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { generatePayrollPeriod } from "@/lib/payroll/generate";
import { notifyRoles } from "@/lib/notify";

const schema = z.object({
  periodType: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  label: z.string().trim().min(1),
});

export async function createPayrollPeriod(formData: FormData) {
  const user = await requirePermission("payroll", "create");
  const data = schema.parse({
    periodType: formData.get("periodType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    label: formData.get("label"),
  });

  const startDate = new Date(`${data.startDate}T00:00:00`);
  const endDate = new Date(`${data.endDate}T23:59:59`);
  if (endDate < startDate) {
    throw new Error("End date must be on or after the start date.");
  }

  const period = await db.payrollPeriod.create({
    data: { periodType: data.periodType, startDate, endDate, label: data.label, createdById: user.id },
  });
  await logAudit({ userId: user.id, action: "CREATE", entityType: "PayrollPeriod", entityId: period.id });
  revalidatePath("/payroll");
}

export async function generatePayroll(periodId: string) {
  const user = await requirePermission("payroll", "create");
  const result = await generatePayrollPeriod(periodId);
  await logAudit({ userId: user.id, action: "UPDATE", entityType: "PayrollPeriod", entityId: periodId, description: `Generated ${result.created} record(s)` });
  if (result.created > 0) {
    const period = await db.payrollPeriod.findUniqueOrThrow({ where: { id: periodId } });
    await notifyRoles(["ADMIN", "ACCOUNTANT"], {
      type: "PAYROLL_READY",
      title: "Payroll ready for review",
      message: `${period.label}: ${result.created} payroll record(s) generated.`,
      relatedEntityType: "PayrollPeriod",
      relatedEntityId: periodId,
    });
  }
  revalidatePath("/payroll");
  revalidatePath(`/payroll/${periodId}`);
}

export async function approvePayrollPeriod(periodId: string) {
  const user = await requirePermission("payroll", "approve");
  const period = await db.payrollPeriod.findUniqueOrThrow({ where: { id: periodId } });
  if (period.status !== "CALCULATED") {
    throw new Error("Only a calculated payroll period can be approved.");
  }
  await db.payrollPeriod.update({ where: { id: periodId }, data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date() } });
  await logAudit({ userId: user.id, action: "APPROVE", entityType: "PayrollPeriod", entityId: periodId });
  revalidatePath("/payroll");
  revalidatePath(`/payroll/${periodId}`);
}

export async function closePayrollPeriod(periodId: string) {
  const user = await requirePermission("payroll", "approve");
  const period = await db.payrollPeriod.findUniqueOrThrow({ where: { id: periodId } });
  if (period.status !== "APPROVED") {
    throw new Error("Only an approved payroll period can be closed.");
  }
  await db.payrollPeriod.update({ where: { id: periodId }, data: { status: "CLOSED", paidAt: new Date() } });
  await logAudit({ userId: user.id, action: "UPDATE", entityType: "PayrollPeriod", entityId: periodId, description: "Closed" });
  revalidatePath("/payroll");
  revalidatePath(`/payroll/${periodId}`);
}
