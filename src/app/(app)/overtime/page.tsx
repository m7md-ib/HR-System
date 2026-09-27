import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { getServerDictionary } from "@/i18n/server";
import { getEmployeeOptions } from "@/lib/queries/employee-options";
import { getSettings } from "@/lib/queries/attendance";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { DurationBadge } from "@/components/duration-badge";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { CreateOvertimeButton, ApproveOvertimeButton, VoidOvertimeButton } from "./overtime-dialogs";

export default async function OvertimePage() {
  const user = await requirePermission("overtime", "view");
  const { dict } = await getServerDictionary();

  const [entries, employees, settings] = await Promise.all([
    db.overtimeEntry.findMany({ include: { employee: true }, orderBy: { date: "desc" } }),
    getEmployeeOptions(),
    getSettings(),
  ]);

  const canApprove = can(user.role, "overtime", "approve");
  const canDelete = can(user.role, "overtime", "delete");
  const total = entries.reduce((s, e) => s + Number(e.overtimeAmount), 0);

  return (
    <div>
      <PageHeader
        title={dict.overtime.title}
        description={dict.overtime.subtitle}
        actions={can(user.role, "overtime", "create") ? <CreateOvertimeButton employees={employees} defaultMultiplier={settings.overtimeMultiplier.toString()} /> : undefined}
      />
      <Card className="mb-4 flex items-center justify-between p-4">
        <span className="text-sm font-medium text-muted">{dict.overtime.overtimeAmount} ({dict.common.total})</span>
        <span className="text-lg font-bold text-accent">{formatMoney(total)}</span>
      </Card>
      <Card>
        {entries.length === 0 ? (
          <div className="p-6"><EmptyState title={dict.overtime.noResults} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.common.date}</TH>
                <TH>{dict.common.employee}</TH>
                <TH>{dict.overtime.overtimeDuration}</TH>
                <TH>{dict.overtime.multiplier}</TH>
                <TH>{dict.overtime.overtimeAmount}</TH>
                <TH>{dict.common.status}</TH>
                <TH>{dict.common.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {entries.map((e) => (
                <TR key={e.id}>
                  <TD>{formatDate(e.date)}</TD>
                  <TD><Link href={`/employees/${e.employeeId}`} className="font-medium text-primary hover:underline">{e.employee.fullNameEn}</Link></TD>
                  <TD><DurationBadge minutes={e.overtimeMinutes} /></TD>
                  <TD>×{e.overtimeRate.toString()}</TD>
                  <TD className="font-semibold">{formatMoney(e.overtimeAmount)}</TD>
                  <TD><Badge tone={e.approved ? "success" : "warning"}>{e.approved ? dict.overtime.approved : dict.overtime.notApproved}</Badge></TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      {canApprove && !e.approved && <ApproveOvertimeButton id={e.id} />}
                      {canDelete && !e.payrollRecordId && <VoidOvertimeButton id={e.id} />}
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
