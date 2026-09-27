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
import { CreateBonusButton, ApproveBonusButton, VoidBonusButton } from "./bonus-dialogs";

export default async function BonusesPage() {
  const user = await requirePermission("bonuses", "view");
  const { dict } = await getServerDictionary();

  const [bonuses, employees] = await Promise.all([
    db.bonus.findMany({ include: { employee: true, approvedBy: true }, orderBy: { date: "desc" } }),
    getEmployeeOptions(),
  ]);

  const canApprove = can(user.role, "bonuses", "approve");
  const canDelete = can(user.role, "bonuses", "delete");
  const total = bonuses.filter((b) => b.status === "ACTIVE").reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div>
      <PageHeader
        title={dict.bonuses.title}
        description={dict.bonuses.subtitle}
        actions={can(user.role, "bonuses", "create") ? <CreateBonusButton employees={employees} /> : undefined}
      />
      <Card className="mb-4 flex items-center justify-between p-4">
        <span className="text-sm font-medium text-muted">{dict.common.total}</span>
        <span className="text-lg font-bold text-success">{formatMoney(total)}</span>
      </Card>
      <Card>
        {bonuses.length === 0 ? (
          <div className="p-6"><EmptyState title={dict.bonuses.noResults} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.common.date}</TH>
                <TH>{dict.common.employee}</TH>
                <TH>{dict.bonuses.bonusType}</TH>
                <TH>{dict.common.amount}</TH>
                <TH>{dict.common.reason}</TH>
                <TH>{dict.common.status}</TH>
                <TH>{dict.common.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {bonuses.map((b) => (
                <TR key={b.id}>
                  <TD>{formatDate(b.date)}</TD>
                  <TD><Link href={`/employees/${b.employeeId}`} className="font-medium text-primary hover:underline">{b.employee.fullNameEn}</Link></TD>
                  <TD>{b.type}</TD>
                  <TD>{formatMoney(b.amount)}</TD>
                  <TD>{b.reason ?? "—"}</TD>
                  <TD><StatusBadge status={b.status} label={dict.statuses.recordStatus[b.status]} /></TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      {canApprove && !b.approvedById && b.status === "ACTIVE" && <ApproveBonusButton id={b.id} />}
                      {canDelete && b.status === "ACTIVE" && !b.payrollRecordId && <VoidBonusButton id={b.id} />}
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
