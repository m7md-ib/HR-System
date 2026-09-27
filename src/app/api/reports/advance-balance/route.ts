import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { buildExcelBuffer, excelResponse } from "@/lib/export/excel";
import { formatDate } from "@/lib/format";

export async function GET() {
  await requirePermission("reports", "export");
  const advances = await db.advance.findMany({
    where: { status: { in: ["ACTIVE", "PARTIALLY_SETTLED"] } },
    include: { employee: true },
    orderBy: { date: "asc" },
  });

  const rows = advances.map((a) => ({
    date: formatDate(a.date),
    employeeNumber: a.employee.employeeNumber,
    employee: a.employee.fullNameEn,
    amount: Number(a.amount),
    remaining: Number(a.remainingBalance),
    status: a.status,
  }));

  const buffer = await buildExcelBuffer({
    sheetName: "Advance Balance",
    columns: [
      { header: "Date", key: "date", width: 14 },
      { header: "Employee Number", key: "employeeNumber", width: 16 },
      { header: "Employee", key: "employee", width: 24 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Remaining Balance", key: "remaining", width: 16 },
      { header: "Status", key: "status", width: 16 },
    ],
    rows,
    totals: { employee: "TOTAL", remaining: rows.reduce((s, r) => s + r.remaining, 0) },
  });

  return excelResponse(buffer, "advance-balance-report.xlsx");
}
