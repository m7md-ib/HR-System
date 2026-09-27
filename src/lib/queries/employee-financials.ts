import "server-only";
import { db } from "@/lib/db";
import { addMoney, roundMoney, subtractMoney } from "@/lib/money";

export async function getEmployeeFinancialSummary(employeeId: string) {
  const [payrollAgg, outstandingAdvances, deductionAgg, reimbursementAgg, unlinkedPayments] = await Promise.all([
    db.payrollRecord.aggregate({
      where: { employeeId, status: "ACTIVE" },
      _sum: { regularEarnings: true, overtimeEarnings: true, bonusTotal: true, allowanceTotal: true, netPayable: true, paidAmount: true, remainingAmount: true },
    }),
    db.advance.aggregate({
      where: { employeeId, status: { in: ["ACTIVE", "PARTIALLY_SETTLED"] } },
      _sum: { remainingBalance: true },
    }),
    db.deduction.aggregate({
      where: { employeeId, status: "ACTIVE" },
      _sum: { amount: true },
    }),
    db.employeeExpense.aggregate({
      where: { employeeId, approvalStatus: "APPROVED" },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { employeeId, payrollRecordId: null, status: "ACTIVE" },
      _sum: { amount: true },
    }),
  ]);

  const totalEarnings = roundMoney(
    addMoney(
      payrollAgg._sum.regularEarnings?.toString() ?? 0,
      payrollAgg._sum.overtimeEarnings?.toString() ?? 0,
      payrollAgg._sum.bonusTotal?.toString() ?? 0,
      payrollAgg._sum.allowanceTotal?.toString() ?? 0,
    ),
  );
  const totalAdvances = roundMoney(outstandingAdvances._sum.remainingBalance?.toString() ?? 0);
  const totalDeductions = roundMoney(deductionAgg._sum.amount?.toString() ?? 0);
  const totalReimbursements = roundMoney(reimbursementAgg._sum.amount?.toString() ?? 0);
  const netPayable = roundMoney(payrollAgg._sum.netPayable?.toString() ?? 0);
  const paid = roundMoney(addMoney(payrollAgg._sum.paidAmount?.toString() ?? 0, unlinkedPayments._sum.amount?.toString() ?? 0));
  const remaining = roundMoney(subtractMoney(addMoney(payrollAgg._sum.remainingAmount?.toString() ?? 0), 0));

  return {
    totalEarnings: totalEarnings.toFixed(2),
    totalAdvances: totalAdvances.toFixed(2),
    totalDeductions: totalDeductions.toFixed(2),
    totalReimbursements: totalReimbursements.toFixed(2),
    netPayable: netPayable.toFixed(2),
    paid: paid.toFixed(2),
    remaining: remaining.toFixed(2),
  };
}
