import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { getServerDictionary, getLocale } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TFoot, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { DurationBadge } from "@/components/duration-badge";
import { formatMoney } from "@/lib/money";
import { GeneratePayrollButton, ApprovePeriodButton, ClosePeriodButton } from "../payroll-dialogs";

export default async function PayrollPeriodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("payroll", "view");
  const { dict } = await getServerDictionary();
  const locale = await getLocale();
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;
  const { id } = await params;

  const period = await db.payrollPeriod.findUnique({
    where: { id },
    include: { records: { include: { employee: true }, orderBy: { employee: { fullNameEn: "asc" } } } },
  });
  if (!period) notFound();

  const isMonthly = period.periodType === "MONTHLY";
  const totals = period.records.reduce(
    (acc, r) => ({
      worked: acc.worked + r.workedMinutes,
      gross: acc.gross + Number(r.grossTotal),
      advance: acc.advance + Number(r.advanceDeduction),
      deduction: acc.deduction + Number(r.deductionTotal),
      net: acc.net + Number(r.netPayable),
      paid: acc.paid + Number(r.paidAmount),
      remaining: acc.remaining + Number(r.remainingAmount),
    }),
    { worked: 0, gross: 0, advance: 0, deduction: 0, net: 0, paid: 0, remaining: 0 },
  );

  return (
    <div>
      <Link href="/payroll" className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
        <BackIcon size={14} /> {dict.payroll.backToPeriods}
      </Link>
      <PageHeader
        title={period.label}
        description={`${dict.statuses.payrollType[period.periodType]} · ${dict.statuses.payrollStatus[period.status]}`}
        actions={
          <div className="flex gap-2">
            {can(user.role, "payroll", "create") && period.status !== "CLOSED" && <GeneratePayrollButton periodId={period.id} />}
            {can(user.role, "payroll", "approve") && period.status === "CALCULATED" && <ApprovePeriodButton periodId={period.id} />}
            {can(user.role, "payroll", "approve") && period.status === "APPROVED" && <ClosePeriodButton periodId={period.id} />}
          </div>
        }
      />

      <Card>
        {period.records.length === 0 ? (
          <div className="p-6"><EmptyState title={dict.payroll.noRecords} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.common.employee}</TH>
                <TH>{dict.payroll.workedHours}</TH>
                {isMonthly && <TH>{dict.payroll.workingDays}</TH>}
                {isMonthly && <TH>{dict.payroll.absentDays}</TH>}
                <TH>{dict.payroll.grossTotal}</TH>
                <TH>{dict.advances.title}</TH>
                <TH>{dict.deductions.title}</TH>
                <TH>{dict.payroll.netPayable}</TH>
                <TH>{dict.payroll.paidAmount}</TH>
                <TH>{dict.payroll.remainingAmount}</TH>
                <TH>{dict.common.status}</TH>
                <TH>{dict.common.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {period.records.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/employees/${r.employeeId}`} className="font-medium text-primary hover:underline">{r.employee.fullNameEn}</Link>
                  </TD>
                  <TD><DurationBadge minutes={r.workedMinutes} /></TD>
                  {isMonthly && <TD>{r.workingDays}</TD>}
                  {isMonthly && <TD>{r.absentDays}</TD>}
                  <TD>{formatMoney(r.grossTotal)}</TD>
                  <TD className="text-danger">{formatMoney(r.advanceDeduction)}</TD>
                  <TD className="text-danger">{formatMoney(r.deductionTotal)}</TD>
                  <TD className="font-semibold">{formatMoney(r.netPayable)}</TD>
                  <TD>{formatMoney(r.paidAmount)}</TD>
                  <TD>{formatMoney(r.remainingAmount)}</TD>
                  <TD><StatusBadge status={r.status} label={dict.statuses.recordStatus[r.status]} /></TD>
                  <TD>
                    <Link href={`/payroll/records/${r.id}`} className="text-xs font-medium text-primary hover:underline">
                      {dict.payroll.viewDetails}
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
            <TFoot>
              <TR>
                <TD>{dict.common.total}</TD>
                <TD><DurationBadge minutes={totals.worked} /></TD>
                {isMonthly && <TD />}
                {isMonthly && <TD />}
                <TD>{formatMoney(totals.gross)}</TD>
                <TD>{formatMoney(totals.advance)}</TD>
                <TD>{formatMoney(totals.deduction)}</TD>
                <TD>{formatMoney(totals.net)}</TD>
                <TD>{formatMoney(totals.paid)}</TD>
                <TD>{formatMoney(totals.remaining)}</TD>
                <TD /><TD />
              </TR>
            </TFoot>
          </Table>
        )}
      </Card>
    </div>
  );
}
