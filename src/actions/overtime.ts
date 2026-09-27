"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { toPrismaDecimal } from "@/lib/money";
import { durationToMinutes } from "@/lib/time/engine";
import { calculateOvertimePay } from "@/lib/payroll/engine";
import { getSettings } from "@/lib/queries/attendance";

const schema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  normalDuration: z.string().optional(),
  overtimeDuration: z.string().min(1),
  multiplier: z.string().optional(),
  notes: z.string().trim().optional(),
});

export async function createOvertimeEntry(formData: FormData) {
  const user = await requirePermission("overtime", "create");
  const data = schema.parse({
    employeeId: formData.get("employeeId"),
    date: formData.get("date"),
    normalDuration: formData.get("normalDuration") || undefined,
    overtimeDuration: formData.get("overtimeDuration"),
    multiplier: formData.get("multiplier") || undefined,
    notes: formData.get("notes") || undefined,
  });

  const employee = await db.employee.findUniqueOrThrow({ where: { id: data.employeeId } });
  const settings = await getSettings();
  const multiplier = data.multiplier ? Number(data.multiplier) : Number(settings.overtimeMultiplier);
  const overtimeMinutes = durationToMinutes(data.overtimeDuration);
  const normalMinutes = data.normalDuration ? durationToMinutes(data.normalDuration) : 0;
  const overtimeAmount = calculateOvertimePay(overtimeMinutes, employee.hourlyRate.toString(), multiplier);

  const entry = await db.overtimeEntry.create({
    data: {
      employeeId: data.employeeId,
      date: new Date(`${data.date}T00:00:00`),
      normalMinutes,
      overtimeMinutes,
      overtimeRate: toPrismaDecimal(multiplier),
      hourlyRateSnapshot: employee.hourlyRate,
      overtimeAmount: toPrismaDecimal(overtimeAmount),
      notes: data.notes,
    },
  });
  await logAudit({ userId: user.id, action: "CREATE", entityType: "OvertimeEntry", entityId: entry.id, newValue: { overtimeMinutes, overtimeAmount: overtimeAmount.toFixed(2) } });
  revalidatePath("/overtime");
  revalidatePath(`/employees/${data.employeeId}`);
}

export async function approveOvertimeEntry(id: string) {
  const user = await requirePermission("overtime", "approve");
  const entry = await db.overtimeEntry.update({ where: { id }, data: { approved: true, approvedById: user.id } });
  await logAudit({ userId: user.id, action: "APPROVE", entityType: "OvertimeEntry", entityId: id });
  revalidatePath("/overtime");
  revalidatePath(`/employees/${entry.employeeId}`);
}

export async function voidOvertimeEntry(id: string) {
  const user = await requirePermission("overtime", "delete");
  const entry = await db.overtimeEntry.findUniqueOrThrow({ where: { id } });
  if (entry.payrollRecordId) {
    throw new Error("This overtime entry has already been included in payroll and cannot be removed directly.");
  }
  await db.overtimeEntry.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "DELETE", entityType: "OvertimeEntry", entityId: id });
  revalidatePath("/overtime");
  revalidatePath(`/employees/${entry.employeeId}`);
}
