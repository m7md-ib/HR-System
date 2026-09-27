/**
 * Centralized time calculation engine.
 *
 * CRITICAL RULE: durations are always carried as whole minutes (integers).
 * A value like 6.5 is NEVER treated as "6 hours 50 minutes" — decimal hours
 * are only ever produced at the edge, on demand, for display or external math.
 */

export interface DurationParts {
  hours: number;
  minutes: number;
}

/** Splits a Date into its calendar-date string (YYYY-MM-DD) and HH:MM time. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Combines a work date with a HH:MM check-in time and an optional HH:MM
 * check-out time into absolute timestamps. If the check-out clock time is
 * less than or equal to the check-in clock time, the shift is assumed to
 * cross midnight and the check-out is rolled to the next calendar day.
 *
 * Example: date=2026-09-27, checkIn=22:00, checkOut=02:00
 *   -> checkIn = 2026-09-27T22:00, checkOut = 2026-09-28T02:00
 */
export function combineShiftTimestamps(
  workDate: string,
  checkInTime: string,
  checkOutTime: string | null,
): { checkIn: Date; checkOut: Date | null } {
  const checkIn = parseDateAndTime(workDate, checkInTime);
  if (!checkOutTime) {
    return { checkIn, checkOut: null };
  }
  let checkOut = parseDateAndTime(workDate, checkOutTime);
  if (checkOut.getTime() <= checkIn.getTime()) {
    checkOut = new Date(checkOut.getTime() + 24 * 60 * 60 * 1000);
  }
  return { checkIn, checkOut };
}

function parseDateAndTime(dateKey: string, time: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
}

/**
 * Raw duration in minutes between two absolute timestamps, minus a break.
 * Never returns a negative number — a check-out at or before check-in is a
 * data error the caller must reject before calling this (see validateShift).
 */
export function calculateDuration(
  checkIn: Date,
  checkOut: Date,
  breakMinutes = 0,
): number {
  const rawMinutes = Math.round((checkOut.getTime() - checkIn.getTime()) / 60000);
  if (rawMinutes < 0) {
    throw new Error("Check-out must be after check-in");
  }
  return Math.max(0, rawMinutes - Math.max(0, breakMinutes));
}

export function validateShift(checkIn: Date, checkOut: Date | null): string | null {
  if (!checkOut) return null;
  if (checkOut.getTime() <= checkIn.getTime()) {
    return "Check-out time must be after check-in time.";
  }
  return null;
}

/** Sums any number of minute-durations. The only correct way to add time. */
export function sumDurations(...minutes: number[]): number {
  return minutes.reduce((total, m) => total + (Number.isFinite(m) ? m : 0), 0);
}

/** Formats total minutes as HH:MM, e.g. 530 -> "08:50". Hours are not capped at 24. */
export function minutesToDuration(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(totalMinutes));
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Parses an "HH:MM" string back into total minutes. Inverse of minutesToDuration. */
export function durationToMinutes(hhmm: string): number {
  const match = /^(-?)(\d+):([0-5]?\d)$/.exec(hhmm.trim());
  if (!match) {
    throw new Error(`Invalid duration format: "${hhmm}", expected HH:MM`);
  }
  const [, sign, h, m] = match;
  const total = Number(h) * 60 + Number(m);
  return sign === "-" ? -total : total;
}

/**
 * Converts minutes to decimal hours ONLY for cases that explicitly need a
 * mathematical decimal value (e.g. exporting to a spreadsheet formula).
 * Never use this for display of a duration — use minutesToDuration instead.
 */
export function minutesToDecimalHours(totalMinutes: number, precision = 4): number {
  return Number((totalMinutes / 60).toFixed(precision));
}

export function minutesToParts(totalMinutes: number): DurationParts {
  const abs = Math.abs(Math.round(totalMinutes));
  return { hours: Math.floor(abs / 60), minutes: abs % 60 };
}

/**
 * Splits a total worked duration into regular vs overtime minutes against a
 * standard-minutes threshold (e.g. 480 = 8h/day, or a weekly/monthly total).
 * This is the auto-suggestion baseline; actual payroll overtime should come
 * from approved OvertimeEntry records for accountability, see payroll engine.
 */
export function calculateOvertime(
  totalWorkedMinutes: number,
  standardMinutes: number,
): { regularMinutes: number; overtimeMinutes: number } {
  const regularMinutes = Math.min(totalWorkedMinutes, standardMinutes);
  const overtimeMinutes = Math.max(0, totalWorkedMinutes - standardMinutes);
  return { regularMinutes, overtimeMinutes };
}

export interface AttendanceLike {
  date: Date | string;
  workedMinutes: number;
}

/** Total minutes worked across a set of attendance entries (any range). */
export function calculatePayrollHours(entries: AttendanceLike[]): number {
  return sumDurations(...entries.map((e) => e.workedMinutes));
}

/** Total minutes worked within a single ISO week (entries pre-filtered by caller). */
export function calculateWeeklyHours(entries: AttendanceLike[]): number {
  return calculatePayrollHours(entries);
}

/** Total minutes worked within a single calendar month (entries pre-filtered by caller). */
export function calculateMonthlyHours(entries: AttendanceLike[]): number {
  return calculatePayrollHours(entries);
}
