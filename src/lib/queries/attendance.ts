import "server-only";
import { db } from "@/lib/db";
import { sumDurations } from "@/lib/time/engine";

export async function getTotalWorkedMinutes(employeeId: string, from: Date, to: Date): Promise<number> {
  const entries = await db.attendanceEntry.findMany({
    where: { employeeId, date: { gte: from, lte: to } },
    select: { workedMinutes: true },
  });
  return sumDurations(...entries.map((e) => e.workedMinutes));
}

export async function getSettings() {
  const settings = await db.settings.findUnique({ where: { id: 1 } });
  if (settings) return settings;
  return db.settings.create({ data: { id: 1 } });
}
