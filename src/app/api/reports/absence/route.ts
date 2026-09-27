import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { buildExcelBuffer, excelResponse } from "@/lib/export/excel";

export async function GET(request: Request) {
  await requirePermission("reports", "export");
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ? new Date(`${searchParams.get("from")}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = searchParams.get("to") ? new Date(`${searchParams.get("to")}T23:59:59`) : new Date();

  const entries = await db.attendanceEntry.findMany({ where: { status: "ABSENT", date: { gte: from, lte: to } }, include: { employee: true } });
  const byEmployee = new Map<string, { employeeNumber: string; name: string; count: number }>();
  for (const e of entries) {
    const bucket = byEmployee.get(e.employeeId) ?? { employeeNumber: e.employee.employeeNumber, name: e.employee.fullNameEn, count: 0 };
    bucket.count += 1;
    byEmployee.set(e.employeeId, bucket);
  }
  const rows = Array.from(byEmployee.values()).sort((a, b) => b.count - a.count);

  const buffer = await buildExcelBuffer({
    sheetName: "Absence",
    columns: [
      { header: "Employee Number", key: "employeeNumber", width: 16 },
      { header: "Employee", key: "name", width: 24 },
      { header: "Absent Days", key: "count", width: 14 },
    ],
    rows,
    totals: { name: "TOTAL", count: entries.length },
  });

  return excelResponse(buffer, "absence-report.xlsx");
}
