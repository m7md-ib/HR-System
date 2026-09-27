import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { getServerDictionary } from "@/i18n/server";
import { getEmployeeOptions } from "@/lib/queries/employee-options";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { CreatePaymentButton, VoidPaymentButton } from "./payment-dialogs";

export default async function PaymentsPage() {
  const user = await requirePermission("payments", "view");
  const { dict } = await getServerDictionary();

  const [payments, employees] = await Promise.all([
    db.payment.findMany({ include: { employee: true, payrollRecord: { include: { payrollPeriod: true } } }, orderBy: { paymentDate: "desc" } }),
    getEmployeeOptions(),
  ]);

  const canDelete = can(user.role, "payments", "delete");
  const total = payments.filter((p) => p.status === "ACTIVE").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div>
      <PageHeader
        title={dict.payments.title}
        description={dict.payments.subtitle}
        actions={can(user.role, "payments", "create") ? <CreatePaymentButton employees={employees} /> : undefined}
      />
      <Card className="mb-4 flex items-center justify-between p-4">
        <span className="text-sm font-medium text-muted">{dict.common.total}</span>
        <span className="text-lg font-bold text-success">{formatMoney(total)}</span>
      </Card>
      <Card>
        {payments.length === 0 ? (
          <div className="p-6"><EmptyState title={dict.payments.noResults} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.common.date}</TH>
                <TH>{dict.common.employee}</TH>
                <TH>{dict.payments.linkedPayroll}</TH>
                <TH>{dict.common.amount}</TH>
                <TH>{dict.common.method}</TH>
                <TH>{dict.common.referenceNumber}</TH>
                <TH>{dict.common.status}</TH>
                <TH>{dict.common.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {payments.map((p) => (
                <TR key={p.id}>
                  <TD>{formatDate(p.paymentDate)}</TD>
                  <TD><Link href={`/employees/${p.employeeId}`} className="font-medium text-primary hover:underline">{p.employee.fullNameEn}</Link></TD>
                  <TD>
                    {p.payrollRecord ? (
                      <Link href={`/payroll/records/${p.payrollRecord.id}`} className="text-primary hover:underline">{p.payrollRecord.payrollPeriod.label}</Link>
                    ) : "—"}
                  </TD>
                  <TD>{formatMoney(p.amount)}</TD>
                  <TD>{dict.statuses.paymentMethod[p.paymentMethod]}</TD>
                  <TD>{p.referenceNumber ?? "—"}</TD>
                  <TD><StatusBadge status={p.status} label={dict.statuses.recordStatus[p.status]} /></TD>
                  <TD>{canDelete && p.status === "ACTIVE" && <VoidPaymentButton id={p.id} />}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
