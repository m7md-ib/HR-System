import { describe, expect, it } from "vitest";
import {
  calculateDuration,
  calculateOvertime,
  combineShiftTimestamps,
  durationToMinutes,
  minutesToDecimalHours,
  minutesToDuration,
  sumDurations,
  validateShift,
} from "./engine";

describe("calculateDuration", () => {
  it("computes 08:00 -> 14:30 as 6h30m (390 minutes)", () => {
    const { checkIn, checkOut } = combineShiftTimestamps("2026-09-01", "08:00", "14:30");
    expect(calculateDuration(checkIn, checkOut!)).toBe(390);
    expect(minutesToDuration(390)).toBe("06:30");
  });

  it("computes 10:00 -> 12:20 as 2h20m (140 minutes)", () => {
    const { checkIn, checkOut } = combineShiftTimestamps("2026-09-01", "10:00", "12:20");
    expect(calculateDuration(checkIn, checkOut!)).toBe(140);
    expect(minutesToDuration(140)).toBe("02:20");
  });

  it("NEVER treats 6.5 + 2.2 decimal addition as correct — real minute math for Mohammad's two shifts totals 08:50", () => {
    const shift1 = combineShiftTimestamps("2026-09-01", "08:00", "14:30");
    const shift2 = combineShiftTimestamps("2026-09-02", "10:00", "12:20");
    const m1 = calculateDuration(shift1.checkIn, shift1.checkOut!);
    const m2 = calculateDuration(shift2.checkIn, shift2.checkOut!);
    const total = sumDurations(m1, m2);
    expect(total).toBe(530);
    expect(minutesToDuration(total)).toBe("08:50");
    // Explicitly prove the naive decimal-hour trap would have been wrong:
    expect(6.5 + 2.2).not.toBeCloseTo(8.8333, 3);
    expect(minutesToDecimalHours(total)).toBeCloseTo(8.8333, 3);
  });

  it("handles an overnight shift 22:00 -> 02:00 as 4 hours, never negative", () => {
    const { checkIn, checkOut } = combineShiftTimestamps("2026-09-01", "22:00", "02:00");
    expect(checkOut!.getTime()).toBeGreaterThan(checkIn.getTime());
    expect(calculateDuration(checkIn, checkOut!)).toBe(240);
    expect(minutesToDuration(240)).toBe("04:00");
  });

  it("handles an overnight shift 23:30 -> 02:30 as exactly 3 hours", () => {
    const { checkIn, checkOut } = combineShiftTimestamps("2026-09-01", "23:30", "02:30");
    expect(calculateDuration(checkIn, checkOut!)).toBe(180);
    expect(minutesToDuration(180)).toBe("03:00");
  });

  it("applies a break correctly: 08:00 -> 17:00 minus 01:00 break = 08:00", () => {
    const { checkIn, checkOut } = combineShiftTimestamps("2026-09-01", "08:00", "17:00");
    const minutes = calculateDuration(checkIn, checkOut!, 60);
    expect(minutes).toBe(480);
    expect(minutesToDuration(minutes)).toBe("08:00");
  });

  it("combines multiple shifts in the same day: 08:00-12:00 and 14:00-18:30 = 08:30", () => {
    const shift1 = combineShiftTimestamps("2026-09-01", "08:00", "12:00");
    const shift2 = combineShiftTimestamps("2026-09-01", "14:00", "18:30");
    const total = sumDurations(
      calculateDuration(shift1.checkIn, shift1.checkOut!),
      calculateDuration(shift2.checkIn, shift2.checkOut!),
    );
    expect(minutesToDuration(total)).toBe("08:30");
  });

  it("rejects a check-out at/before check-in via validateShift", () => {
    const checkIn = new Date(2026, 8, 1, 10, 0);
    const badCheckOut = new Date(2026, 8, 1, 9, 0);
    expect(validateShift(checkIn, badCheckOut)).toMatch(/after check-in/i);
  });

  it("formats large weekly/monthly totals without wrapping at 24 hours", () => {
    expect(minutesToDuration(23 * 60 + 45)).toBe("23:45");
    expect(minutesToDuration(168 * 60 + 35)).toBe("168:35");
    expect(minutesToDuration(325 * 60 + 40)).toBe("325:40");
    expect(minutesToDuration(40 * 60 + 30)).toBe("40:30");
  });
});

describe("durationToMinutes", () => {
  it("is the exact inverse of minutesToDuration", () => {
    for (const m of [0, 30, 75, 390, 530, 1440, 19540]) {
      expect(durationToMinutes(minutesToDuration(m))).toBe(m);
    }
  });

  it("parses 08:50 as 530 minutes", () => {
    expect(durationToMinutes("08:50")).toBe(530);
  });
});

describe("calculateOvertime", () => {
  it("splits regular vs overtime against an 8h (480 min) standard day", () => {
    expect(calculateOvertime(530, 480)).toEqual({ regularMinutes: 480, overtimeMinutes: 50 });
    expect(calculateOvertime(300, 480)).toEqual({ regularMinutes: 300, overtimeMinutes: 0 });
  });
});
