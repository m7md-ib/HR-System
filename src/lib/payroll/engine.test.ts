import { describe, expect, it } from "vitest";
import { durationToMinutes } from "@/lib/time/engine";
import {
  calculateDailyBasePay,
  calculateHourlyEarnings,
  calculateOvertimePay,
  computePayroll,
  suggestAdvanceDeduction,
} from "./engine";

describe("calculateHourlyEarnings", () => {
  it("Mohammad: 08:50 (530 min) at 3.00 JOD/hr = 26.50 JOD", () => {
    const minutes = durationToMinutes("08:50");
    const pay = calculateHourlyEarnings(minutes, 3.0);
    expect(pay.toFixed(2)).toBe("26.50");
  });

  it("never derives pay from decimal-hour rounding (8.8333 * 3 would drift)", () => {
    const minutes = durationToMinutes("08:50");
    const pay = calculateHourlyEarnings(minutes, 3.0);
    expect(pay.toNumber()).toBe(26.5);
  });
});

describe("calculateOvertimePay", () => {
  it("02:30 overtime at 3 JOD/hr with 1.5x multiplier = 11.25 JOD", () => {
    const otMinutes = durationToMinutes("02:30");
    const pay = calculateOvertimePay(otMinutes, 3.0, 1.5);
    expect(pay.toFixed(2)).toBe("11.25");
  });
});

describe("calculateDailyBasePay", () => {
  it("uses the hourly basis when configured", () => {
    const pay = calculateDailyBasePay({
      basis: "HOURLY",
      workedMinutes: durationToMinutes("08:50"),
      hourlyRate: 3.0,
      dailyRate: 20,
    });
    expect(pay.toFixed(2)).toBe("26.50");
  });

  it("uses the flat daily rate when configured, ignoring exact minutes worked", () => {
    const pay = calculateDailyBasePay({
      basis: "FIXED_DAILY",
      workedMinutes: durationToMinutes("06:10"),
      hourlyRate: 3.0,
      dailyRate: 20,
    });
    expect(pay.toFixed(2)).toBe("20.00");
  });

  it("pays nothing for a fixed-daily employee who did not work that day", () => {
    const pay = calculateDailyBasePay({ basis: "FIXED_DAILY", workedMinutes: 0, hourlyRate: 3.0, dailyRate: 20 });
    expect(pay.toFixed(2)).toBe("0.00");
  });
});

describe("computePayroll", () => {
  it("Mohammad's daily payroll: 26.50 regular pay minus a 10.00 advance = 16.50 net", () => {
    const result = computePayroll({
      regularEarnings: 26.5,
      overtimeEarnings: 0,
      bonusTotal: 0,
      allowanceTotal: 0,
      reimbursementTotal: 0,
      advanceDeduction: 10,
      deductionTotal: 0,
    });
    expect(result.grossEarnings.toFixed(2)).toBe("26.50");
    expect(result.totalPayable.toFixed(2)).toBe("26.50");
    expect(result.netPayable.toFixed(2)).toBe("16.50");
    expect(result.remaining.toFixed(2)).toBe("16.50");
  });

  it("section 43 full employee financial summary example (Mohammad)", () => {
    const result = computePayroll({
      regularEarnings: 650,
      overtimeEarnings: 45,
      bonusTotal: 25,
      allowanceTotal: 0,
      reimbursementTotal: 35,
      advanceDeduction: 100,
      deductionTotal: 20,
      paidAmount: 500,
    });
    expect(result.grossEarnings.toFixed(2)).toBe("720.00");
    expect(result.totalPayable.toFixed(2)).toBe("755.00");
    expect(result.netPayable.toFixed(2)).toBe("635.00");
    expect(result.remaining.toFixed(2)).toBe("135.00");
  });

  it("section 56 transparency example", () => {
    const result = computePayroll({
      regularEarnings: 500,
      overtimeEarnings: 45,
      bonusTotal: 25,
      allowanceTotal: 0,
      reimbursementTotal: 35,
      advanceDeduction: 100,
      deductionTotal: 20,
    });
    expect(result.grossEarnings.toFixed(2)).toBe("570.00");
    expect(result.totalPayable.toFixed(2)).toBe("605.00");
    expect(result.netPayable.toFixed(2)).toBe("485.00");
  });
});

describe("suggestAdvanceDeduction", () => {
  it("100 JOD advance, HR deducts 25 -> remaining 75", () => {
    const deduction = 25;
    const remainingAfter = 100 - deduction;
    expect(remainingAfter).toBe(75);
    expect(suggestAdvanceDeduction(100, 25).toFixed(2)).toBe("25.00");
  });

  it("caps the suggested deduction at what is actually available to pay", () => {
    expect(suggestAdvanceDeduction(100, 40).toFixed(2)).toBe("40.00");
  });

  it("suggests nothing when the balance is already settled", () => {
    expect(suggestAdvanceDeduction(0, 100).toFixed(2)).toBe("0.00");
  });
});
