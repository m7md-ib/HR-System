import { requirePermission } from "@/lib/auth/current-user";
import { getPayrollSummaryRecords } from "@/lib/queries/reports";
import { buildExcelBuffer, excelResponse } from "@/lib/export/excel";

export async function GET(request: Request) {
  await requirePermission("reports", "export");
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ? new Date(`${searchParams.get("from")}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = searchParams.get("to") ? new Date(`${searchParams.get("to")}T23:59:59`) : new Date();

  const records = await getPayrollSummaryRecords({ from, to });
  const byDept = new Map<string, { employees: Set<string>; gross: number; net: number; paid: number; remaining: number }>();
  for (const r of records) {
    const name = r.employee.department?.name ?? "Unassigned";
    const bucket = byDept.get(name) ?? { employees: new Set(), gross: 0, net: 0, paid: 0, remaining: 0 };
    bucket.employees.add(r.employeeId);
    bucket.gross += Number(r.grossTotal);
    bucket.net += Number(r.netPayable);
    bucket.paid += Number(r.paidAmount);
    bucket.remaining += Number(r.remainingAmount);
    byDept.set(name, bucket);
  }
  const rows = Array.from(byDept.entries()).map(([department, v]) => ({ department, employees: v.employees.size, gross: v.gross, net: v.net, paid: v.paid, remaining: v.remaining }));
  const totals = {
    department: "TOTAL",
    employees: rows.reduce((s, r) => s + r.employees, 0),
    gross: rows.reduce((s, r) => s + r.gross, 0),
    net: rows.reduce((s, r) => s + r.net, 0),
    paid: rows.reduce((s, r) => s + r.paid, 0),
    remaining: rows.reduce((s, r) => s + r.remaining, 0),
  };

  const buffer = await buildExcelBuffer({
    sheetName: "Department Payroll",
    columns: [
      { header: "Department", key: "department", width: 24 },
      { header: "Employees", key: "employees", width: 12 },
      { header: "Gross", key: "gross", width: 14 },
      { header: "Net Payable", key: "net", width: 14 },
      { header: "Paid", key: "paid", width: 14 },
      { header: "Remaining", key: "remaining", width: 14 },
    ],
    rows,
    totals,
  });

  return excelResponse(buffer, "department-payroll.xlsx");
}
