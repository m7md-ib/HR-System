import { db } from "@/lib/db";
import { addMoney, subtractMoney, toPrismaDecimal, type MoneyInput } from "@/lib/money";
import type { LedgerEntryType } from "@/generated/prisma/client";

/**
 * The ledger tracks a single running balance per employee: the net amount
 * the company still owes them.
 *   CREDIT increases it — earnings, bonuses, overtime, allowances, reimbursements.
 *   DEBIT decreases it — advances issued (cash already handed over), non-advance
 *     deductions, and actual cash payments made.
 *
 * Advance issuance is debited immediately (the cash moves then). The later
 * payroll-time recoupment of that advance is NOT debited again — it is purely
 * bookkeeping (AdvanceTransaction) on top of a balance already reduced at
 * issuance. Only the newly-earned gross pay is credited at payroll time.
 */
export async function appendLedgerEntry(params: {
  employeeId: string;
  date: Date;
  type: LedgerEntryType;
  description: string;
  debit?: MoneyInput;
  credit?: MoneyInput;
  sourceType?: string;
  sourceId?: string;
}) {
  const last = await db.employeeLedgerEntry.findFirst({
    where: { employeeId: params.employeeId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  const previousBalance = last?.balanceAfter ?? 0;
  const debit = params.debit ?? 0;
  const credit = params.credit ?? 0;
  const balanceAfter = addMoney(subtractMoney(previousBalance, debit), credit);

  return db.employeeLedgerEntry.create({
    data: {
      employeeId: params.employeeId,
      date: params.date,
      type: params.type,
      description: params.description,
      debit: toPrismaDecimal(debit),
      credit: toPrismaDecimal(credit),
      balanceAfter: toPrismaDecimal(balanceAfter),
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    },
  });
}

export async function getEmployeeLedgerBalance(employeeId: string): Promise<string> {
  const last = await db.employeeLedgerEntry.findFirst({
    where: { employeeId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return (last?.balanceAfter ?? 0).toString();
}
