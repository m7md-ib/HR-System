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
import { CreateAdvanceButton, RecordDeductionButton, CancelAdvanceButton } from "./advance-dialogs";

export default async function AdvancesPage() {
  const user = await requirePermission("advances", "view");
  const { dict } = await getServerDictionary();

  const [advances, employees] = await Promise.all([
    db.advance.findMany({ include: { employee: true }, orderBy: { date: "desc" } }),
    getEmployeeOptions(),
  ]);

  const canEdit = can(user.role, "advances", "edit");
  const canDelete = can(user.role, "advances", "delete");

  const totalOutstanding = advances
    .filter((a) => a.status === "ACTIVE" || a.status === "PARTIALLY_SETTLED")
    .reduce((sum, a) => sum + Number(a.remainingBalance), 0);

  return (
    <div>
      <PageHeader
        title={dict.advances.title}
        description={dict.advances.subtitle}
        actions={can(user.role, "advances", "create") ? <CreateAdvanceButton employees={employees} /> : undefined}
      />

      <Card className="mb-4 flex items-center justify-between p-4">
        <span className="text-sm font-medium text-muted">{dict.advances.remainingBalance} ({dict.common.all})</span>
        <span className="text-lg font-bold text-accent">{formatMoney(totalOutstanding)}</span>
      </Card>

      <Card>
        {advances.length === 0 ? (
          <div className="p-6"><EmptyState title={dict.advances.noResults} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.common.date}</TH>
                <TH>{dict.common.employee}</TH>
                <TH>{dict.common.amount}</TH>
                <TH>{dict.advances.remainingBalance}</TH>
                <TH>{dict.common.reason}</TH>
                <TH>{dict.common.status}</TH>
                <TH>{dict.common.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {advances.map((a) => (
                <TR key={a.id}>
                  <TD>{formatDate(a.date)}</TD>
                  <TD>
                    <Link href={`/employees/${a.employeeId}`} className="font-medium text-primary hover:underline">
                      {a.employee.fullNameEn}
                    </Link>
                  </TD>
                  <TD>{formatMoney(a.amount)}</TD>
                  <TD className="font-semibold">{formatMoney(a.remainingBalance)}</TD>
                  <TD>{a.reason ?? "—"}</TD>
                  <TD><StatusBadge status={a.status} label={dict.statuses.advanceStatus[a.status]} /></TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      {canEdit && (a.status === "ACTIVE" || a.status === "PARTIALLY_SETTLED") && (
                        <RecordDeductionButton advanceId={a.id} remainingBalance={a.remainingBalance.toString()} />
                      )}
                      {canDelete && a.status !== "SETTLED" && a.status !== "CANCELLED" && <CancelAdvanceButton id={a.id} />}
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
