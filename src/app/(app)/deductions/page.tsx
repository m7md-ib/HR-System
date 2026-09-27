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
import { CreateDeductionButton, ApproveDeductionButton, VoidDeductionButton } from "./deduction-dialogs";

export default async function DeductionsPage() {
  const user = await requirePermission("deductions", "view");
  const { dict } = await getServerDictionary();

  const [deductions, employees] = await Promise.all([
    db.deduction.findMany({ include: { employee: true, approvedBy: true }, orderBy: { date: "desc" } }),
    getEmployeeOptions(),
  ]);

  const canApprove = can(user.role, "deductions", "approve");
  const canDelete = can(user.role, "deductions", "delete");
  const total = deductions.filter((d) => d.status === "ACTIVE").reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div>
      <PageHeader
        title={dict.deductions.title}
        description={dict.deductions.subtitle}
        actions={can(user.role, "deductions", "create") ? <CreateDeductionButton employees={employees} /> : undefined}
      />
      <Card className="mb-4 flex items-center justify-between p-4">
        <span className="text-sm font-medium text-muted">{dict.common.total}</span>
        <span className="text-lg font-bold text-danger">{formatMoney(total)}</span>
      </Card>
      <Card>
        {deductions.length === 0 ? (
          <div className="p-6"><EmptyState title={dict.deductions.noResults} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.common.date}</TH>
                <TH>{dict.common.employee}</TH>
                <TH>{dict.common.type}</TH>
                <TH>{dict.common.amount}</TH>
                <TH>{dict.common.reason}</TH>
                <TH>{dict.deductions.approvedBy}</TH>
                <TH>{dict.common.status}</TH>
                <TH>{dict.common.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {deductions.map((d) => (
                <TR key={d.id}>
                  <TD>{formatDate(d.date)}</TD>
                  <TD><Link href={`/employees/${d.employeeId}`} className="font-medium text-primary hover:underline">{d.employee.fullNameEn}</Link></TD>
                  <TD>{dict.statuses.deductionType[d.type]}</TD>
                  <TD>{formatMoney(d.amount)}</TD>
                  <TD>{d.reason ?? "—"}</TD>
                  <TD>{d.approvedBy?.name ?? "—"}</TD>
                  <TD><StatusBadge status={d.status} label={dict.statuses.recordStatus[d.status]} /></TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      {canApprove && !d.approvedById && d.status === "ACTIVE" && <ApproveDeductionButton id={d.id} />}
                      {canDelete && d.status === "ACTIVE" && !d.payrollRecordId && <VoidDeductionButton id={d.id} />}
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
