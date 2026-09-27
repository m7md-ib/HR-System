import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { buildExcelBuffer, excelResponse } from "@/lib/export/excel";
import { formatDate } from "@/lib/format";

export async function GET(request: Request) {
  await requirePermission("reports", "export");
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  if (!employeeId) {
    return new Response("employeeId is required", { status: 400 });
  }

  const [employee, entries] = await Promise.all([
    db.employee.findUniqueOrThrow({ where: { id: employeeId } }),
    db.employeeLedgerEntry.findMany({ where: { employeeId }, orderBy: [{ date: "asc" }, { createdAt: "asc" }] }),
  ]);

  const rows = entries.map((l) => ({
    date: formatDate(l.date),
    type: l.type,
    description: l.description,
    debit: Number(l.debit) || undefined,
    credit: Number(l.credit) || undefined,
    balance: Number(l.balanceAfter),
  }));

  const buffer = await buildExcelBuffer({
    sheetName: "Employee Ledger",
    title: `Ledger — ${employee.fullNameEn} (${employee.employeeNumber})`,
    columns: [
      { header: "Date", key: "date", width: 14 },
      { header: "Type", key: "type", width: 18 },
      { header: "Description", key: "description", width: 30 },
      { header: "Debit", key: "debit", width: 12 },
      { header: "Credit", key: "credit", width: 12 },
      { header: "Balance", key: "balance", width: 14 },
    ],
    rows,
  });

  return excelResponse(buffer, `ledger-${employee.employeeNumber}.xlsx`);
}
