import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { getSettings } from "@/lib/queries/attendance";
import { getEmployeeOptions } from "@/lib/queries/employee-options";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ReportPrintHeader } from "@/components/reports/report-header";
import { PrintButton, ExportExcelLink } from "@/components/reports/report-toolbar";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { Search } from "lucide-react";

export default async function EmployeeLedgerReportPage({ searchParams }: { searchParams: Promise<{ employeeId?: string }> }) {
  await requirePermission("reports", "view");
  const { dict } = await getServerDictionary();
  const sp = await searchParams;
  const [settings, employees] = await Promise.all([getSettings(), getEmployeeOptions()]);

  const employeeId = sp.employeeId || employees[0]?.id;
  const employee = employeeId ? await db.employee.findUnique({ where: { id: employeeId } }) : null;
  const entries = employeeId
    ? await db.employeeLedgerEntry.findMany({ where: { employeeId }, orderBy: [{ date: "asc" }, { createdAt: "asc" }] })
    : [];

  return (
    <div>
      <PageHeader
        title={dict.reports.employeeLedger}
        actions={employeeId ? <><PrintButton /><ExportExcelLink href={`/api/reports/employee-ledger?employeeId=${employeeId}`} /></> : undefined}
      />
      <Card className="mb-4 no-print">
        <form method="get" className="flex flex-wrap items-end gap-3 p-4">
          <Select name="employeeId" defaultValue={employeeId ?? ""} className="w-auto min-w-[220px]">
            {employees.map((e) => <option key={e.id} value={e.id}>{e.fullNameEn} ({e.employeeNumber})</option>)}
          </Select>
          <Button type="submit" variant="secondary"><Search size={15} /> {dict.common.apply}</Button>
        </form>
      </Card>
      <div className="print-full-width">
        <ReportPrintHeader companyName={settings.companyName} reportName={dict.reports.employeeLedger} filtersSummary={employee ? `${employee.fullNameEn} (${employee.employeeNumber})` : undefined} />
        <Card>
          {entries.length === 0 ? <div className="p-6"><EmptyState title={dict.common.noData} /></div> : (
            <Table>
              <THead><TR><TH>{dict.common.date}</TH><TH>{dict.common.type}</TH><TH>{dict.common.description}</TH><TH>{dict.common.debit}</TH><TH>{dict.common.credit}</TH><TH>{dict.common.balance}</TH></TR></THead>
              <TBody>
                {entries.map((l) => (
                  <TR key={l.id}>
                    <TD>{formatDate(l.date)}</TD><TD>{l.type}</TD><TD>{l.description}</TD>
                    <TD className="text-danger">{Number(l.debit) > 0 ? formatMoney(l.debit) : "—"}</TD>
                    <TD className="text-success">{Number(l.credit) > 0 ? formatMoney(l.credit) : "—"}</TD>
                    <TD className="font-semibold">{formatMoney(l.balanceAfter)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
