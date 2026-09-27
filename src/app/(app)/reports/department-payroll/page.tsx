import { requirePermission } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { getSettings } from "@/lib/queries/attendance";
import { getPayrollSummaryRecords } from "@/lib/queries/reports";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TFoot, TH, THead, TR } from "@/components/ui/table";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ReportPrintHeader } from "@/components/reports/report-header";
import { PrintButton, ExportExcelLink } from "@/components/reports/report-toolbar";
import { formatMoney } from "@/lib/money";
import { formatDate, toDateInputValue } from "@/lib/format";
import { Search } from "lucide-react";

export default async function DepartmentPayrollReportPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requirePermission("reports", "view");
  const { dict } = await getServerDictionary();
  const sp = await searchParams;
  const settings = await getSettings();

  const from = sp.from ? new Date(`${sp.from}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = sp.to ? new Date(`${sp.to}T23:59:59`) : new Date();

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
  const rows = Array.from(byDept.entries()).map(([name, v]) => ({ name, count: v.employees.size, ...v }));
  const totals = rows.reduce((acc, r) => ({ gross: acc.gross + r.gross, net: acc.net + r.net, paid: acc.paid + r.paid, remaining: acc.remaining + r.remaining }), { gross: 0, net: 0, paid: 0, remaining: 0 });

  return (
    <div>
      <PageHeader
        title={dict.reports.departmentPayroll}
        actions={<><PrintButton /><ExportExcelLink href={`/api/reports/department-payroll?from=${toDateInputValue(from)}&to=${toDateInputValue(to)}`} /></>}
      />
      <Card className="mb-4 no-print">
        <form method="get" className="flex flex-wrap items-end gap-3 p-4">
          <Input type="date" name="from" defaultValue={toDateInputValue(from)} />
          <Input type="date" name="to" defaultValue={toDateInputValue(to)} />
          <Button type="submit" variant="secondary"><Search size={15} /> {dict.common.filter}</Button>
        </form>
      </Card>
      <div className="print-full-width">
        <ReportPrintHeader companyName={settings.companyName} reportName={dict.reports.departmentPayroll} rangeSummary={`${formatDate(from)} — ${formatDate(to)}`} />
        <Card>
          <Table>
            <THead>
              <TR><TH>{dict.common.department}</TH><TH>{dict.departments.employeesCount}</TH><TH>{dict.payroll.grossTotal}</TH><TH>{dict.payroll.netPayable}</TH><TH>{dict.payroll.paidAmount}</TH><TH>{dict.payroll.remainingAmount}</TH></TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.name}>
                  <TD className="font-medium">{r.name}</TD><TD>{r.count}</TD><TD>{formatMoney(r.gross)}</TD>
                  <TD className="font-semibold">{formatMoney(r.net)}</TD><TD>{formatMoney(r.paid)}</TD><TD>{formatMoney(r.remaining)}</TD>
                </TR>
              ))}
            </TBody>
            <TFoot>
              <TR><TD>{dict.common.total}</TD><TD /><TD>{formatMoney(totals.gross)}</TD><TD>{formatMoney(totals.net)}</TD><TD>{formatMoney(totals.paid)}</TD><TD>{formatMoney(totals.remaining)}</TD></TR>
            </TFoot>
          </Table>
        </Card>
      </div>
    </div>
  );
}
