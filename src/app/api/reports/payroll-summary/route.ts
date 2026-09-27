import { requirePermission } from "@/lib/auth/current-user";
import { getPayrollSummaryRecords } from "@/lib/queries/reports";
import { buildExcelBuffer, excelResponse } from "@/lib/export/excel";
import { minutesToDuration } from "@/lib/time/engine";
import { formatDate } from "@/lib/format";

export async function GET(request: Request) {
  await requirePermission("reports", "export");
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ? new Date(`${searchParams.get("from")}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = searchParams.get("to") ? new Date(`${searchParams.get("to")}T23:59:59`) : new Date();

  const records = await getPayrollSummaryRecords({
    from,
    to,
    departmentId: searchParams.get("departmentId") ?? undefined,
    employmentType: searchParams.get("employmentType") ?? undefined,
  });

  const rows = records.map((r) => ({
    employee: r.employee.fullNameEn,
    department: r.employee.department?.name ?? "",
    period: r.payrollPeriod.label,
    workedHours: minutesToDuration(r.workedMinutes),
    gross: Number(r.grossTotal),
    overtime: Number(r.overtimeEarnings),
    bonus: Number(r.bonusTotal),
    reimbursement: Number(r.reimbursementTotal),
    advance: Number(r.advanceDeduction),
    deduction: Number(r.deductionTotal),
    net: Number(r.netPayable),
    paid: Number(r.paidAmount),
    remaining: Number(r.remainingAmount),
  }));

  const totals = {
    employee: "TOTAL",
    workedHours: minutesToDuration(records.reduce((s, r) => s + r.workedMinutes, 0)),
    gross: rows.reduce((s, r) => s + r.gross, 0),
    overtime: rows.reduce((s, r) => s + r.overtime, 0),
    bonus: rows.reduce((s, r) => s + r.bonus, 0),
    reimbursement: rows.reduce((s, r) => s + r.reimbursement, 0),
    advance: rows.reduce((s, r) => s + r.advance, 0),
    deduction: rows.reduce((s, r) => s + r.deduction, 0),
    net: rows.reduce((s, r) => s + r.net, 0),
    paid: rows.reduce((s, r) => s + r.paid, 0),
    remaining: rows.reduce((s, r) => s + r.remaining, 0),
  };

  const buffer = await buildExcelBuffer({
    sheetName: "Payroll Summary",
    title: `Payroll Summary — ${formatDate(from)} to ${formatDate(to)}`,
    columns: [
      { header: "Employee", key: "employee", width: 24 },
      { header: "Department", key: "department", width: 18 },
      { header: "Period", key: "period", width: 18 },
      { header: "Worked Hours", key: "workedHours", width: 14 },
      { header: "Gross", key: "gross", width: 12 },
      { header: "Overtime", key: "overtime", width: 12 },
      { header: "Bonus", key: "bonus", width: 12 },
      { header: "Reimbursement", key: "reimbursement", width: 14 },
      { header: "Advance", key: "advance", width: 12 },
      { header: "Deduction", key: "deduction", width: 12 },
      { header: "Net Payable", key: "net", width: 14 },
      { header: "Paid", key: "paid", width: 12 },
      { header: "Remaining", key: "remaining", width: 12 },
    ],
    rows,
    totals,
  });

  return excelResponse(buffer, `payroll-summary-${searchParams.get("from") ?? "period"}.xlsx`);
}
