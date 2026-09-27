"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { calculateDuration, combineShiftTimestamps, validateShift } from "@/lib/time/engine";

const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE", "HOLIDAY", "DAY_OFF"] as const;
const NO_CLOCK_STATUSES = new Set<(typeof ATTENDANCE_STATUSES)[number]>(["ABSENT", "LEAVE", "HOLIDAY", "DAY_OFF"]);

const schema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  date: z.string().min(1, "Date is required"),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  breakMinutes: z.string().optional(),
  status: z.enum(ATTENDANCE_STATUSES),
  notes: z.string().trim().optional(),
});

async function assertPayrollNotClosed(employeeId: string, date: Date) {
  const closed = await db.payrollRecord.findFirst({
    where: {
      employeeId,
      payrollPeriod: { status: "CLOSED", startDate: { lte: date }, endDate: { gte: date } },
    },
  });
  if (closed) {
    throw new Error("Payroll for this period has already been closed. Attendance cannot be modified.");
  }
}

function readForm(formData: FormData) {
  return schema.parse({
    employeeId: formData.get("employeeId"),
    date: formData.get("date"),
    checkIn: formData.get("checkIn") || undefined,
    checkOut: formData.get("checkOut") || undefined,
    breakMinutes: formData.get("breakMinutes") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
}

function computeShift(raw: ReturnType<typeof readForm>) {
  const requiresClock = !NO_CLOCK_STATUSES.has(raw.status);
  let checkIn: Date | null = null;
  let checkOut: Date | null = null;
  let workedMinutes = 0;
  const breakMinutes = Number(raw.breakMinutes || 0);

  if (requiresClock) {
    if (!raw.checkIn) {
      throw new Error("Check-in time is required for this attendance status.");
    }
    const combined = combineShiftTimestamps(raw.date, raw.checkIn, raw.checkOut || null);
    checkIn = combined.checkIn;
    checkOut = combined.checkOut;
    if (checkOut) {
      const validationError = validateShift(checkIn, checkOut);
      if (validationError) throw new Error(validationError);
      workedMinutes = calculateDuration(checkIn, checkOut, breakMinutes);
    }
  }

  return { checkIn, checkOut, breakMinutes, workedMinutes };
}

async function assertNoOverlap(employeeId: string, date: Date, checkIn: Date, checkOut: Date, excludeId?: string) {
  const existing = await db.attendanceEntry.findMany({
    where: {
      employeeId,
      date,
      id: excludeId ? { not: excludeId } : undefined,
      checkIn: { not: null },
      checkOut: { not: null },
    },
  });
  const overlaps = existing.some((e) => e.checkIn! < checkOut && checkIn < e.checkOut!);
  if (overlaps) {
    throw new Error("This shift overlaps with another attendance entry for the same employee and date.");
  }
}

export async function createAttendanceEntry(formData: FormData) {
  const user = await requirePermission("attendance", "create");
  const raw = readForm(formData);
  const dateOnly = new Date(`${raw.date}T00:00:00`);
  await assertPayrollNotClosed(raw.employeeId, dateOnly);

  const shift = computeShift(raw);
  if (shift.checkIn && shift.checkOut) {
    await assertNoOverlap(raw.employeeId, dateOnly, shift.checkIn, shift.checkOut);
  }

  const entry = await db.attendanceEntry.create({
    data: {
      employeeId: raw.employeeId,
      date: dateOnly,
      checkIn: shift.checkIn,
      checkOut: shift.checkOut,
      breakMinutes: shift.breakMinutes,
      workedMinutes: shift.workedMinutes,
      status: raw.status,
      notes: raw.notes,
      createdById: user.id,
    },
  });
  await logAudit({ userId: user.id, action: "CREATE", entityType: "AttendanceEntry", entityId: entry.id, newValue: { date: raw.date, workedMinutes: shift.workedMinutes } });
  revalidatePath("/attendance");
  revalidatePath("/working-hours");
}

export async function updateAttendanceEntry(id: string, formData: FormData) {
  const user = await requirePermission("attendance", "edit");
  const raw = readForm(formData);
  const dateOnly = new Date(`${raw.date}T00:00:00`);
  const before = await db.attendanceEntry.findUniqueOrThrow({ where: { id } });
  await assertPayrollNotClosed(raw.employeeId, dateOnly);

  const shift = computeShift(raw);
  if (shift.checkIn && shift.checkOut) {
    await assertNoOverlap(raw.employeeId, dateOnly, shift.checkIn, shift.checkOut, id);
  }

  await db.attendanceEntry.update({
    where: { id },
    data: {
      employeeId: raw.employeeId,
      date: dateOnly,
      checkIn: shift.checkIn,
      checkOut: shift.checkOut,
      breakMinutes: shift.breakMinutes,
      workedMinutes: shift.workedMinutes,
      status: raw.status,
      notes: raw.notes,
    },
  });
  await logAudit({
    userId: user.id,
    action: "UPDATE",
    entityType: "AttendanceEntry",
    entityId: id,
    oldValue: { workedMinutes: before.workedMinutes, status: before.status },
    newValue: { workedMinutes: shift.workedMinutes, status: raw.status },
  });
  revalidatePath("/attendance");
  revalidatePath("/working-hours");
}

export async function deleteAttendanceEntry(id: string) {
  const user = await requirePermission("attendance", "delete");
  const before = await db.attendanceEntry.findUniqueOrThrow({ where: { id } });
  await assertPayrollNotClosed(before.employeeId, before.date);
  await db.attendanceEntry.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "DELETE", entityType: "AttendanceEntry", entityId: id, oldValue: before });
  revalidatePath("/attendance");
  revalidatePath("/working-hours");
}
