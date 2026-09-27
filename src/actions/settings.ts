"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  companyName: z.string().trim().min(1),
  companyNameAr: z.string().trim().min(1),
  currency: z.string().trim().min(1),
  timezone: z.string().trim().min(1),
  weekStartsOn: z.string(),
  standardDailyMinutes: z.string(),
  standardMonthlyDays: z.string(),
  overtimeMultiplier: z.string(),
  lateGraceMinutes: z.string(),
});

export async function updateSettings(formData: FormData) {
  const user = await requirePermission("settings", "edit");
  const data = schema.parse({
    companyName: formData.get("companyName"),
    companyNameAr: formData.get("companyNameAr"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
    weekStartsOn: formData.get("weekStartsOn"),
    standardDailyMinutes: formData.get("standardDailyMinutes"),
    standardMonthlyDays: formData.get("standardMonthlyDays"),
    overtimeMultiplier: formData.get("overtimeMultiplier"),
    lateGraceMinutes: formData.get("lateGraceMinutes"),
  });

  await db.settings.upsert({
    where: { id: 1 },
    update: {
      companyName: data.companyName,
      companyNameAr: data.companyNameAr,
      currency: data.currency,
      timezone: data.timezone,
      weekStartsOn: Number(data.weekStartsOn),
      standardDailyMinutes: Number(data.standardDailyMinutes),
      standardMonthlyDays: Number(data.standardMonthlyDays),
      overtimeMultiplier: data.overtimeMultiplier,
      lateGraceMinutes: Number(data.lateGraceMinutes),
    },
    create: {
      id: 1,
      companyName: data.companyName,
      companyNameAr: data.companyNameAr,
      currency: data.currency,
      timezone: data.timezone,
      weekStartsOn: Number(data.weekStartsOn),
      standardDailyMinutes: Number(data.standardDailyMinutes),
      standardMonthlyDays: Number(data.standardMonthlyDays),
      overtimeMultiplier: data.overtimeMultiplier,
      lateGraceMinutes: Number(data.lateGraceMinutes),
    },
  });

  await logAudit({ userId: user.id, action: "UPDATE", entityType: "Settings", entityId: "1" });
  revalidatePath("/settings");
}
