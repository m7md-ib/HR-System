import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { getServerDictionary } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { CreatePayrollPeriodButton } from "./payroll-dialogs";

export default async function PayrollPeriodsPage() {
  const user = await requirePermission("payroll", "view");
  const { dict } = await getServerDictionary();

  const periods = await db.payrollPeriod.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { records: true } } },
  });

  return (
    <div>
      <PageHeader
        title={dict.payroll.title}
        description={dict.payroll.subtitle}
        actions={can(user.role, "payroll", "create") ? <CreatePayrollPeriodButton /> : undefined}
      />
      <Card>
        {periods.length === 0 ? (
          <div className="p-6"><EmptyState title={dict.payroll.noResults} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.payroll.label}</TH>
                <TH>{dict.payroll.periodType}</TH>
                <TH>{dict.common.startDate}</TH>
                <TH>{dict.common.endDate}</TH>
                <TH>{dict.payroll.recordsCount}</TH>
                <TH>{dict.common.status}</TH>
              </TR>
            </THead>
            <TBody>
              {periods.map((p) => (
                <TR key={p.id} className="cursor-pointer">
                  <TD>
                    <Link href={`/payroll/${p.id}`} className="font-medium text-primary hover:underline">{p.label}</Link>
                  </TD>
                  <TD>{dict.statuses.payrollType[p.periodType]}</TD>
                  <TD>{formatDate(p.startDate)}</TD>
                  <TD>{formatDate(p.endDate)}</TD>
                  <TD>{p._count.records}</TD>
                  <TD><StatusBadge status={p.status} label={dict.statuses.payrollStatus[p.status]} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
