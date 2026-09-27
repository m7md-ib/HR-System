import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { getServerDictionary, getLocale } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { DurationBadge } from "@/components/duration-badge";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { RecordPaymentButton } from "@/app/(app)/payments/payment-dialogs";

export default async function PayrollRecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("payroll", "view");
  const { dict } = await getServerDictionary();
  const locale = await getLocale();
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;
  const { id } = await params;

  const record = await db.payrollRecord.findUnique({
    where: { id },
    include: { employee: true, payrollPeriod: true, items: true, payments: { where: { status: "ACTIVE" }, orderBy: { paymentDate: "desc" } } },
  });
  if (!record) notFound();

  return (
    <div>
      <Link href={`/payroll/${record.payrollPeriodId}`} className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
        <BackIcon size={14} /> {record.payrollPeriod.label}
      </Link>
      <PageHeader
        title={record.employee.fullNameEn}
        description={`${record.payrollPeriod.label} · ${record.employee.employeeNumber}`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{dict.payroll.breakdownTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {record.items
                  .filter((i) => !["DEDUCTION", "ADVANCE_DEDUCTION"].includes(i.type))
                  .map((item) => (
                    <tr key={item.id} className="border-b border-border/60">
                      <td className="py-2 text-muted">{item.label}</td>
                      <td className="py-2 text-end font-medium">{formatMoney(item.amount)}</td>
                    </tr>
                  ))}
                <tr className="border-b-2 border-foreground/20 font-bold">
                  <td className="py-2">{dict.payroll.grossTotal}</td>
                  <td className="py-2 text-end">{formatMoney(record.grossTotal)}</td>
                </tr>
                {record.items
                  .filter((i) => ["DEDUCTION", "ADVANCE_DEDUCTION"].includes(i.type))
                  .map((item) => (
                    <tr key={item.id} className="border-b border-border/60">
                      <td className="py-2 text-muted">{item.label}</td>
                      <td className="py-2 text-end font-medium text-danger">{formatMoney(item.amount)}</td>
                    </tr>
                  ))}
                <tr className="text-base font-bold text-primary-dark">
                  <td className="py-3">{dict.payroll.netPayable}</td>
                  <td className="py-3 text-end">{formatMoney(record.netPayable)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-muted">{dict.payroll.paidAmount}</td>
                  <td className="py-1 text-end">{formatMoney(record.paidAmount)}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-1 text-muted">{dict.payroll.remainingAmount}</td>
                  <td className="py-1 text-end">{formatMoney(record.remainingAmount)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{dict.common.status}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <StatusBadge status={record.status} label={dict.statuses.recordStatus[record.status]} />
            <div className="flex justify-between"><span className="text-muted">{dict.payroll.workedHours}</span><DurationBadge minutes={record.workedMinutes} /></div>
            <div className="flex justify-between"><span className="text-muted">{dict.payroll.regularHours}</span><DurationBadge minutes={record.regularMinutes} /></div>
            <div className="flex justify-between"><span className="text-muted">{dict.payroll.overtimeHours}</span><DurationBadge minutes={record.overtimeMinutes} /></div>
            {can(user.role, "payments", "create") && Number(record.remainingAmount) > 0 && record.payrollPeriod.status !== "CLOSED" && (
              <RecordPaymentButton employeeId={record.employeeId} payrollRecordId={record.id} remainingAmount={record.remainingAmount.toString()} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>{dict.payments.title}</CardTitle></CardHeader>
        {record.payments.length === 0 ? (
          <CardContent className="text-sm text-muted">{dict.payments.noResults}</CardContent>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.common.date}</TH>
                <TH>{dict.common.amount}</TH>
                <TH>{dict.common.method}</TH>
                <TH>{dict.common.referenceNumber}</TH>
              </TR>
            </THead>
            <TBody>
              {record.payments.map((p) => (
                <TR key={p.id}>
                  <TD>{formatDate(p.paymentDate)}</TD>
                  <TD>{formatMoney(p.amount)}</TD>
                  <TD>{dict.statuses.paymentMethod[p.paymentMethod]}</TD>
                  <TD>{p.referenceNumber ?? "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
