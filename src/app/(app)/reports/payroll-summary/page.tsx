import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { ReportPrintHeader } from "@/components/reports/report-header";
import { PrintButton, ExportExcelLink } from "@/components/reports/report-toolbar";
import { DurationBadge } from "@/components/duration-badge";
import { formatMoney } from "@/lib/money";
import { formatDate, toDateInputValue } from "@/lib/format";
import { getSettings } from "@/lib/queries/attendance";
import { Search } from "lucide-react";
import { getPayrollSummaryRecords } from "@/lib/queries/reports";

export default async function PayrollSummaryReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; departmentId?: string; employmentType?: string }>;
}) {
  await requirePermission("reports", "view");
  const { dict } = await getServerDictionary();
  const sp = await searchParams;
  const settings = await getSettings();

  const from = sp.from ? new Date(`${sp.from}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = sp.to ? new Date(`${sp.to}T23:59:59`) : new Date();

  const [records, departments] = await Promise.all([
    getPayrollSummaryRecords({ from, to, departmentId: sp.departmentId, employmentType: sp.employmentType }),
    db.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totals = records.reduce(
    (acc, r) => ({
      workedMinutes: acc.workedMinutes + r.workedMinutes,
      gross: acc.gross + Number(r.grossTotal),
      overtime: acc.overtime + Number(r.overtimeEarnings),
      bonus: acc.bonus + Number(r.bonusTotal),
      allowance: acc.allowance + Number(r.allowanceTotal),
      reimbursement: acc.reimbursement + Number(r.reimbursementTotal),
      advance: acc.advance + Number(r.advanceDeduction),
      deduction: acc.deduction + Number(r.deductionTotal),
      net: acc.net + Number(r.netPayable),
      paid: acc.paid + Number(r.paidAmount),
      remaining: acc.remaining + Number(r.remainingAmount),
    }),
    { workedMinutes: 0, gross: 0, overtime: 0, bonus: 0, allowance: 0, reimbursement: 0, advance: 0, deduction: 0, net: 0, paid: 0, remaining: 0 },
  );
  const uniqueEmployees = new Set(records.map((r) => r.employeeId)).size;

  const exportParams = new URLSearchParams({ from: toDateInputValue(from), to: toDateInputValue(to), ...(sp.departmentId ? { departmentId: sp.departmentId } : {}), ...(sp.employmentType ? { employmentType: sp.employmentType } : {}) });

  return (
    <div>
      <PageHeader
        title={dict.reports.payrollSummary}
        description={dict.payroll.subtitle}
        actions={
          <>
            <PrintButton />
            <ExportExcelLink href={`/api/reports/payroll-summary?${exportParams.toString()}`} />
          </>
        }
      />

      <Card className="mb-4 no-print">
        <form method="get" className="flex flex-wrap items-end gap-3 p-4">
          <Input type="date" name="from" defaultValue={toDateInputValue(from)} />
          <Input type="date" name="to" defaultValue={toDateInputValue(to)} />
          <Select name="departmentId" defaultValue={sp.departmentId ?? ""} className="w-auto">
            <option value="">{dict.common.department}: {dict.common.all}</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select name="employmentType" defaultValue={sp.employmentType ?? ""} className="w-auto">
            <option value="">{dict.common.type}: {dict.common.all}</option>
            <option value="DAILY">{dict.statuses.employmentType.DAILY}</option>
            <option value="PART_TIME">{dict.statuses.employmentType.PART_TIME}</option>
            <option value="FULL_TIME">{dict.statuses.employmentType.FULL_TIME}</option>
          </Select>
          <Button type="submit" variant="secondary"><Search size={15} /> {dict.common.filter}</Button>
        </form>
      </Card>

      <div className="print-full-width">
        <ReportPrintHeader
          companyName={settings.companyName}
          reportName={dict.reports.payrollSummary}
          rangeSummary={`${formatDate(from)} — ${formatDate(to)}`}
        />

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label={dict.payroll.recordsCount} value={uniqueEmployees} />
          <StatCard label={dict.common.totalWorkingHours} value={<DurationBadge minutes={totals.workedMinutes} />} />
          <StatCard label={dict.payroll.grossTotal} value={formatMoney(totals.gross)} tone="primary" />
          <StatCard label={dict.overtime.title} value={formatMoney(totals.overtime)} />
          <StatCard label={dict.bonuses.title} value={formatMoney(totals.bonus)} />
          <StatCard label={dict.expenses.title} value={formatMoney(totals.reimbursement)} />
          <StatCard label={dict.advances.title} value={formatMoney(totals.advance)} tone="warning" />
          <StatCard label={dict.deductions.title} value={formatMoney(totals.deduction)} tone="danger" />
          <StatCard label={dict.payroll.netPayable} value={formatMoney(totals.net)} tone="success" />
          <StatCard label={dict.payroll.paidAmount} value={formatMoney(totals.paid)} />
          <StatCard label={dict.payroll.remainingAmount} value={formatMoney(totals.remaining)} />
        </div>

        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{dict.common.employee}</TH>
                <TH>{dict.common.department}</TH>
                <TH>{dict.payroll.label}</TH>
                <TH>{dict.payroll.workedHours}</TH>
                <TH>{dict.payroll.grossTotal}</TH>
                <TH>{dict.payroll.netPayable}</TH>
                <TH>{dict.payroll.remainingAmount}</TH>
              </TR>
            </THead>
            <TBody>
              {records.map((r) => (
                <TR key={r.id}>
                  <TD>{r.employee.fullNameEn}</TD>
                  <TD>{r.employee.department?.name ?? "—"}</TD>
                  <TD>{r.payrollPeriod.label}</TD>
                  <TD><DurationBadge minutes={r.workedMinutes} /></TD>
                  <TD>{formatMoney(r.grossTotal)}</TD>
                  <TD className="font-semibold">{formatMoney(r.netPayable)}</TD>
                  <TD>{formatMoney(r.remainingAmount)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
