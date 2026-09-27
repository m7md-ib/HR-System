import { db } from "@/lib/db";
import { addMoney, money, roundMoney, subtractMoney, toPrismaDecimal } from "@/lib/money";
import { sumDurations } from "@/lib/time/engine";
import { calculateHourlyEarnings, computePayroll, suggestAdvanceDeduction } from "./engine";
import { appendLedgerEntry } from "@/lib/ledger";
import type { Employee, PayrollPeriod } from "@/generated/prisma/client";

function distinctDateCount(dates: Date[]): number {
  return new Set(dates.map((d) => d.toDateString())).size;
}

async function calculateRegularEarnings(employee: Employee, period: PayrollPeriod, workedMinutes: number, presentDays: number) {
  if (employee.employmentType === "FULL_TIME") {
    return { regularEarnings: roundMoney(employee.basicSalary.toString()), basicSalarySnapshot: employee.basicSalary.toString() };
  }
  if (employee.employmentType === "PART_TIME") {
    return { regularEarnings: calculateHourlyEarnings(workedMinutes, employee.hourlyRate.toString()), basicSalarySnapshot: money(0) };
  }
  // DAILY
  if (employee.dailyPayBasis === "FIXED_DAILY") {
    return {
      regularEarnings: roundMoney(money(employee.dailyRate.toString()).times(presentDays)),
      basicSalarySnapshot: money(0),
    };
  }
  return { regularEarnings: calculateHourlyEarnings(workedMinutes, employee.hourlyRate.toString()), basicSalarySnapshot: money(0) };
}

export interface GenerateResult {
  created: number;
  skipped: number;
  employeeNames: string[];
}

/**
 * Generates (or re-generates, for employees without an existing record) payroll
 * records for every eligible employee in a period. Eligibility = employmentType
 * matching the period's PayrollType (DAILY/PART_TIME<->WEEKLY/FULL_TIME<->MONTHLY).
 */
export async function generatePayrollPeriod(periodId: string): Promise<GenerateResult> {
  const period = await db.payrollPeriod.findUniqueOrThrow({ where: { id: periodId } });
  if (period.status === "CLOSED") {
    throw new Error("This payroll period is closed and cannot be regenerated.");
  }

  const employmentType = period.periodType === "DAILY" ? "DAILY" : period.periodType === "WEEKLY" ? "PART_TIME" : "FULL_TIME";

  const employees = await db.employee.findMany({
    where: { employmentType, status: { in: ["ACTIVE", "ON_LEAVE"] } },
  });

  const existingEmployeeIds = new Set(
    (await db.payrollRecord.findMany({ where: { payrollPeriodId: periodId }, select: { employeeId: true } })).map((r) => r.employeeId),
  );

  let created = 0;
  const names: string[] = [];

  for (const employee of employees) {
    if (existingEmployeeIds.has(employee.id)) continue;
    await generateRecordForEmployee(period, employee);
    created += 1;
    names.push(employee.fullNameEn);
  }

  await db.payrollPeriod.update({ where: { id: periodId }, data: { status: "CALCULATED" } });

  return { created, skipped: employees.length - created, employeeNames: names };
}

async function generateRecordForEmployee(period: PayrollPeriod, employee: Employee) {
  const range = { gte: period.startDate, lte: period.endDate };

  const [attendanceEntries, overtimeEntries, bonuses, allowances, deductions, expenses, advances] = await Promise.all([
    db.attendanceEntry.findMany({ where: { employeeId: employee.id, date: range } }),
    db.overtimeEntry.findMany({ where: { employeeId: employee.id, date: range, approved: true, payrollRecordId: null } }),
    db.bonus.findMany({ where: { employeeId: employee.id, date: range, status: "ACTIVE", payrollRecordId: null } }),
    db.allowance.findMany({
      where: {
        employeeId: employee.id,
        payrollRecordId: null,
        OR: [
          { recurring: true, effectiveFrom: { lte: period.endDate }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: period.startDate } }] },
          { recurring: false, effectiveFrom: range },
        ],
      },
    }),
    db.deduction.findMany({ where: { employeeId: employee.id, date: range, status: "ACTIVE", payrollRecordId: null } }),
    db.employeeExpense.findMany({ where: { employeeId: employee.id, approvalStatus: "APPROVED", includeInPayroll: true, paymentStatus: "UNPAID", payrollRecordId: null } }),
    db.advance.findMany({ where: { employeeId: employee.id, status: { in: ["ACTIVE", "PARTIALLY_SETTLED"] } }, orderBy: { date: "asc" } }),
  ]);

  const workedMinutes = sumDurations(...attendanceEntries.map((e) => e.workedMinutes));
  const presentDays = distinctDateCount(attendanceEntries.filter((e) => e.workedMinutes > 0).map((e) => e.date));
  const absentDays = attendanceEntries.filter((e) => e.status === "ABSENT").length;
  const leaveDays = attendanceEntries.filter((e) => e.status === "LEAVE").length;

  const overtimeMinutes = sumDurations(...overtimeEntries.map((o) => o.overtimeMinutes));
  const overtimeEarnings = roundMoney(addMoney(...overtimeEntries.map((o) => o.overtimeAmount.toString()), 0));
  const bonusTotal = roundMoney(addMoney(...bonuses.map((b) => b.amount.toString()), 0));
  const allowanceTotal = roundMoney(addMoney(...allowances.map((a) => a.amount.toString()), 0));
  const deductionTotal = roundMoney(addMoney(...deductions.map((d) => d.amount.toString()), 0));
  const reimbursementTotal = roundMoney(addMoney(...expenses.map((e) => e.amount.toString()), 0));

  const { regularEarnings, basicSalarySnapshot } = await calculateRegularEarnings(employee, period, workedMinutes, presentDays);

  const grossBeforeAdvance = roundMoney(
    subtractMoney(addMoney(regularEarnings, overtimeEarnings, bonusTotal, allowanceTotal, reimbursementTotal), deductionTotal),
  );
  const totalOutstandingAdvance = roundMoney(addMoney(...advances.map((a) => a.remainingBalance.toString()), 0));
  const clampedAdvanceDeduction = suggestAdvanceDeduction(totalOutstandingAdvance, grossBeforeAdvance);

  const computation = computePayroll({
    regularEarnings,
    overtimeEarnings,
    bonusTotal,
    allowanceTotal,
    reimbursementTotal,
    advanceDeduction: clampedAdvanceDeduction,
    deductionTotal,
  });

  await db.$transaction(async (tx) => {
    const record = await tx.payrollRecord.create({
      data: {
        payrollPeriodId: period.id,
        employeeId: employee.id,
        workedMinutes,
        regularMinutes: Math.max(0, workedMinutes - overtimeMinutes),
        overtimeMinutes,
        workingDays: presentDays,
        absentDays,
        leaveDays,
        basicSalarySnapshot: toPrismaDecimal(basicSalarySnapshot),
        regularEarnings: toPrismaDecimal(regularEarnings),
        overtimeEarnings: toPrismaDecimal(overtimeEarnings),
        bonusTotal: toPrismaDecimal(bonusTotal),
        allowanceTotal: toPrismaDecimal(allowanceTotal),
        reimbursementTotal: toPrismaDecimal(reimbursementTotal),
        grossTotal: toPrismaDecimal(computation.totalPayable),
        advanceDeduction: toPrismaDecimal(clampedAdvanceDeduction),
        deductionTotal: toPrismaDecimal(deductionTotal),
        netPayable: toPrismaDecimal(computation.netPayable),
        remainingAmount: toPrismaDecimal(computation.netPayable),
        items: {
          create: [
            { type: "REGULAR", label: "Regular Earnings", amount: toPrismaDecimal(regularEarnings) },
            ...(money(overtimeEarnings).gt(0) ? [{ type: "OVERTIME", label: "Overtime", amount: toPrismaDecimal(overtimeEarnings) }] : []),
            ...(money(bonusTotal).gt(0) ? [{ type: "BONUS", label: "Bonuses", amount: toPrismaDecimal(bonusTotal) }] : []),
            ...(money(allowanceTotal).gt(0) ? [{ type: "ALLOWANCE", label: "Allowances", amount: toPrismaDecimal(allowanceTotal) }] : []),
            ...(money(reimbursementTotal).gt(0) ? [{ type: "REIMBURSEMENT", label: "Reimbursements", amount: toPrismaDecimal(reimbursementTotal) }] : []),
            ...(money(deductionTotal).gt(0) ? [{ type: "DEDUCTION", label: "Deductions", amount: toPrismaDecimal(money(deductionTotal).negated()) }] : []),
            ...(money(clampedAdvanceDeduction).gt(0) ? [{ type: "ADVANCE_DEDUCTION", label: "Advance Deduction", amount: toPrismaDecimal(money(clampedAdvanceDeduction).negated()) }] : []),
          ],
        },
      },
    });

    await tx.overtimeEntry.updateMany({ where: { id: { in: overtimeEntries.map((o) => o.id) } }, data: { payrollRecordId: record.id } });
    await tx.bonus.updateMany({ where: { id: { in: bonuses.map((b) => b.id) } }, data: { payrollRecordId: record.id } });
    await tx.allowance.updateMany({ where: { id: { in: allowances.map((a) => a.id) } }, data: { payrollRecordId: record.id } });
    await tx.deduction.updateMany({ where: { id: { in: deductions.map((d) => d.id) } }, data: { payrollRecordId: record.id } });
    await tx.employeeExpense.updateMany({
      where: { id: { in: expenses.map((e) => e.id) } },
      data: { payrollRecordId: record.id, paymentStatus: "INCLUDED_IN_PAYROLL" },
    });

    let remainingToDeduct = money(clampedAdvanceDeduction);
    for (const advance of advances) {
      if (remainingToDeduct.lte(0)) break;
      const take = money(advance.remainingBalance.toString()).lt(remainingToDeduct) ? money(advance.remainingBalance.toString()) : remainingToDeduct;
      if (take.lte(0)) continue;
      const newBalance = subtractMoney(advance.remainingBalance.toString(), take);
      await tx.advanceTransaction.create({
        data: { advanceId: advance.id, date: period.endDate, amount: toPrismaDecimal(take), type: "DEDUCTION", payrollRecordId: record.id },
      });
      await tx.advance.update({
        where: { id: advance.id },
        data: { remainingBalance: toPrismaDecimal(newBalance), status: newBalance.lte(0) ? "SETTLED" : "PARTIALLY_SETTLED" },
      });
      remainingToDeduct = subtractMoney(remainingToDeduct, take);
    }

  });

  const earningsCredit = roundMoney(addMoney(regularEarnings, overtimeEarnings, bonusTotal, allowanceTotal));
  if (money(earningsCredit).gt(0)) {
    await appendLedgerEntry({
      employeeId: employee.id,
      date: period.endDate,
      type: "SALARY",
      description: `${period.label} — earnings`,
      credit: earningsCredit,
      sourceType: "PayrollPeriod",
      sourceId: period.id,
    });
  }
  if (money(reimbursementTotal).gt(0)) {
    await appendLedgerEntry({
      employeeId: employee.id,
      date: period.endDate,
      type: "REIMBURSEMENT",
      description: `${period.label} — reimbursements`,
      credit: reimbursementTotal,
      sourceType: "PayrollPeriod",
      sourceId: period.id,
    });
  }
  if (money(deductionTotal).gt(0)) {
    await appendLedgerEntry({
      employeeId: employee.id,
      date: period.endDate,
      type: "DEDUCTION",
      description: `${period.label} — deductions`,
      debit: deductionTotal,
      sourceType: "PayrollPeriod",
      sourceId: period.id,
    });
  }
}
