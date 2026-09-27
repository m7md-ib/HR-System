/**
 * Centralized payroll calculation engine. All monetary business logic for
 * payroll MUST flow through here — never compute pay in the UI layer.
 */
import { Decimal, addMoney, money, roundMoney, subtractMoney, type MoneyInput } from "@/lib/money";

export function calculateHourlyEarnings(minutes: number, hourlyRate: MoneyInput): Decimal {
  return roundMoney(money(hourlyRate).times(minutes).dividedBy(60));
}

export function calculateOvertimePay(
  overtimeMinutes: number,
  hourlyRate: MoneyInput,
  multiplier: MoneyInput,
): Decimal {
  return roundMoney(money(hourlyRate).times(overtimeMinutes).dividedBy(60).times(multiplier));
}

export type DailyPayBasis = "HOURLY" | "FIXED_DAILY";

/** Base earnings for a single daily-worker day, before overtime/bonus/etc. */
export function calculateDailyBasePay(params: {
  basis: DailyPayBasis;
  workedMinutes: number;
  hourlyRate: MoneyInput;
  dailyRate: MoneyInput;
}): Decimal {
  if (params.basis === "FIXED_DAILY") {
    return params.workedMinutes > 0 ? roundMoney(params.dailyRate) : new Decimal(0);
  }
  return calculateHourlyEarnings(params.workedMinutes, params.hourlyRate);
}

export interface PayrollComputationInput {
  regularEarnings: MoneyInput;
  overtimeEarnings: MoneyInput;
  bonusTotal: MoneyInput;
  allowanceTotal: MoneyInput;
  reimbursementTotal: MoneyInput;
  advanceDeduction: MoneyInput;
  deductionTotal: MoneyInput;
  paidAmount?: MoneyInput;
}

export interface PayrollComputationResult {
  grossEarnings: Decimal;
  totalPayable: Decimal;
  netPayable: Decimal;
  remaining: Decimal;
}

/**
 * Section 44 formula:
 *   Gross Earnings = Regular + Overtime + Bonuses + Allowances
 *   Total Payable  = Gross Earnings + Approved Reimbursements
 *   Net Payroll    = Total Payable - Advances - Deductions
 *   Remaining      = Net Payroll - Paid Amount
 */
export function computePayroll(input: PayrollComputationInput): PayrollComputationResult {
  const grossEarnings = roundMoney(
    addMoney(input.regularEarnings, input.overtimeEarnings, input.bonusTotal, input.allowanceTotal),
  );
  const totalPayable = roundMoney(addMoney(grossEarnings, input.reimbursementTotal));
  const netPayable = roundMoney(
    subtractMoney(subtractMoney(totalPayable, input.advanceDeduction), input.deductionTotal),
  );
  const remaining = roundMoney(subtractMoney(netPayable, input.paidAmount ?? 0));

  return { grossEarnings, totalPayable, netPayable, remaining };
}

/** Suggested advance deduction for a payroll run: full remaining balance, capped at what's payable. */
export function suggestAdvanceDeduction(remainingBalance: MoneyInput, availableToPay: MoneyInput): Decimal {
  const balance = money(remainingBalance);
  const available = money(availableToPay);
  if (balance.lte(0) || available.lte(0)) return new Decimal(0);
  return roundMoney(Decimal.min(balance, available));
}
