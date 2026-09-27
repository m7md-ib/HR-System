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
import { CreateExpenseButton, ApproveExpenseButton, RejectExpenseButton, MarkExpensePaidButton } from "./expense-dialogs";

export default async function ExpensesPage() {
  const user = await requirePermission("expenses", "view");
  const { dict } = await getServerDictionary();

  const [expenses, employees] = await Promise.all([
    db.employeeExpense.findMany({ include: { employee: true }, orderBy: { date: "desc" } }),
    getEmployeeOptions(),
  ]);

  const canApprove = can(user.role, "expenses", "approve");
  const canPay = can(user.role, "expenses", "pay");
  const unpaidApproved = expenses.filter((e) => e.approvalStatus === "APPROVED" && e.paymentStatus === "UNPAID");
  const totalUnpaid = unpaidApproved.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <PageHeader
        title={dict.expenses.title}
        description={dict.expenses.subtitle}
        actions={can(user.role, "expenses", "create") ? <CreateExpenseButton employees={employees} /> : undefined}
      />
      <Card className="mb-4 flex items-center justify-between p-4">
        <span className="text-sm font-medium text-muted">{dict.statuses.expensePaymentStatus.UNPAID} ({dict.statuses.approvalStatus.APPROVED})</span>
        <span className="text-lg font-bold text-danger">{formatMoney(totalUnpaid)}</span>
      </Card>
      <Card>
        {expenses.length === 0 ? (
          <div className="p-6"><EmptyState title={dict.expenses.noResults} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.common.date}</TH>
                <TH>{dict.common.employee}</TH>
                <TH>{dict.expenses.expenseType}</TH>
                <TH>{dict.common.amount}</TH>
                <TH>{dict.expenses.approvalStatus}</TH>
                <TH>{dict.expenses.paymentStatus}</TH>
                <TH>{dict.common.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {expenses.map((e) => (
                <TR key={e.id}>
                  <TD>{formatDate(e.date)}</TD>
                  <TD><Link href={`/employees/${e.employeeId}`} className="font-medium text-primary hover:underline">{e.employee.fullNameEn}</Link></TD>
                  <TD>{e.expenseType}</TD>
                  <TD>{formatMoney(e.amount)}</TD>
                  <TD><StatusBadge status={e.approvalStatus} label={dict.statuses.approvalStatus[e.approvalStatus]} /></TD>
                  <TD><StatusBadge status={e.paymentStatus} label={dict.statuses.expensePaymentStatus[e.paymentStatus]} /></TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      {canApprove && e.approvalStatus === "PENDING" && (
                        <>
                          <ApproveExpenseButton id={e.id} />
                          <RejectExpenseButton id={e.id} />
                        </>
                      )}
                      {canPay && e.approvalStatus === "APPROVED" && e.paymentStatus === "UNPAID" && !e.includeInPayroll && (
                        <MarkExpensePaidButton id={e.id} />
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
