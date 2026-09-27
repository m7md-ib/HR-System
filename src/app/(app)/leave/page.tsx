import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { getServerDictionary } from "@/i18n/server";
import { getEmployeeOptions } from "@/lib/queries/employee-options";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { CreateLeaveButton, ApproveLeaveButton, RejectLeaveButton, CancelLeaveButton } from "./leave-dialogs";

export default async function LeavePage() {
  const user = await requireUser();
  const { dict } = await getServerDictionary();

  const isSelfServiceOnly = !can(user.role, "leave", "approve") && !can(user.role, "employees", "view");
  const canApprove = can(user.role, "leave", "approve");
  const canCreate = can(user.role, "leave", "create");

  const [requests, employees] = await Promise.all([
    db.leaveRequest.findMany({
      where: isSelfServiceOnly ? { employeeId: user.employeeId ?? "__none__" } : undefined,
      include: { employee: true, approvedBy: true },
      orderBy: { startDate: "desc" },
    }),
    isSelfServiceOnly ? Promise.resolve([]) : getEmployeeOptions(),
  ]);

  return (
    <div>
      <PageHeader
        title={dict.leave.title}
        description={dict.leave.subtitle}
        actions={canCreate ? <CreateLeaveButton employees={employees} fixedEmployeeId={isSelfServiceOnly ? (user.employeeId ?? undefined) : undefined} /> : undefined}
      />
      <Card>
        {requests.length === 0 ? (
          <div className="p-6"><EmptyState title={dict.leave.noResults} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                {!isSelfServiceOnly && <TH>{dict.common.employee}</TH>}
                <TH>{dict.leave.leaveType}</TH>
                <TH>{dict.leave.startDate}</TH>
                <TH>{dict.leave.endDate}</TH>
                <TH>{dict.leave.numberOfDays}</TH>
                <TH>{dict.common.reason}</TH>
                <TH>{dict.common.status}</TH>
                <TH>{dict.common.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {requests.map((r) => (
                <TR key={r.id}>
                  {!isSelfServiceOnly && (
                    <TD><Link href={`/employees/${r.employeeId}`} className="font-medium text-primary hover:underline">{r.employee.fullNameEn}</Link></TD>
                  )}
                  <TD>{dict.statuses.leaveType[r.leaveType]}</TD>
                  <TD>{formatDate(r.startDate)}</TD>
                  <TD>{formatDate(r.endDate)}</TD>
                  <TD>{r.numberOfDays.toString()}</TD>
                  <TD>{r.reason ?? "—"}</TD>
                  <TD><StatusBadge status={r.status} label={dict.statuses.leaveStatus[r.status]} /></TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      {canApprove && r.status === "PENDING" && (
                        <>
                          <ApproveLeaveButton id={r.id} />
                          <RejectLeaveButton id={r.id} />
                        </>
                      )}
                      {r.status === "PENDING" && (isSelfServiceOnly || user.employeeId === r.employeeId) && <CancelLeaveButton id={r.id} />}
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
