import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { getSettings } from "@/lib/queries/attendance";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TFoot, TH, THead, TR } from "@/components/ui/table";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportPrintHeader } from "@/components/reports/report-header";
import { PrintButton, ExportExcelLink } from "@/components/reports/report-toolbar";
import { formatDate, toDateInputValue } from "@/lib/format";
import { Search } from "lucide-react";

export default async function AbsenceReportPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requirePermission("reports", "view");
  const { dict } = await getServerDictionary();
  const sp = await searchParams;
  const settings = await getSettings();

  const from = sp.from ? new Date(`${sp.from}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = sp.to ? new Date(`${sp.to}T23:59:59`) : new Date();

  const entries = await db.attendanceEntry.findMany({
    where: { status: "ABSENT", date: { gte: from, lte: to } },
    include: { employee: true },
    orderBy: { date: "desc" },
  });

  const byEmployee = new Map<string, { name: string; count: number }>();
  for (const e of entries) {
    const bucket = byEmployee.get(e.employeeId) ?? { name: e.employee.fullNameEn, count: 0 };
    bucket.count += 1;
    byEmployee.set(e.employeeId, bucket);
  }
  const rows = Array.from(byEmployee.values()).sort((a, b) => b.count - a.count);

  return (
    <div>
      <PageHeader
        title={dict.reports.absence}
        actions={<><PrintButton /><ExportExcelLink href={`/api/reports/absence?from=${toDateInputValue(from)}&to=${toDateInputValue(to)}`} /></>}
      />
      <Card className="mb-4 no-print">
        <form method="get" className="flex flex-wrap items-end gap-3 p-4">
          <Input type="date" name="from" defaultValue={toDateInputValue(from)} />
          <Input type="date" name="to" defaultValue={toDateInputValue(to)} />
          <Button type="submit" variant="secondary"><Search size={15} /> {dict.common.filter}</Button>
        </form>
      </Card>
      <div className="print-full-width">
        <ReportPrintHeader companyName={settings.companyName} reportName={dict.reports.absence} rangeSummary={`${formatDate(from)} — ${formatDate(to)}`} />
        <Card>
          {rows.length === 0 ? <div className="p-6"><EmptyState title={dict.common.noData} /></div> : (
            <Table>
              <THead><TR><TH>{dict.common.employee}</TH><TH>{dict.payroll.absentDays}</TH></TR></THead>
              <TBody>
                {rows.map((r) => (
                  <TR key={r.name}><TD className="font-medium">{r.name}</TD><TD>{r.count}</TD></TR>
                ))}
              </TBody>
              <TFoot><TR><TD>{dict.common.total}</TD><TD>{entries.length}</TD></TR></TFoot>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
