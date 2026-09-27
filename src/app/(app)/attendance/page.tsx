import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { getServerDictionary } from "@/i18n/server";
import { getEmployeeOptions } from "@/lib/queries/employee-options";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { StatusBadge } from "@/components/status-badge";
import { DurationBadge } from "@/components/duration-badge";
import { formatDate, formatTime, toDateInputValue } from "@/lib/format";
import { CreateAttendanceButton, DeleteAttendanceButton, EditAttendanceButton } from "./attendance-dialogs";
import type { AttendanceStatus, Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { Search } from "lucide-react";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string; from?: string; to?: string; status?: string }>;
}) {
  const user = await requirePermission("attendance", "view");
  const { dict } = await getServerDictionary();
  const sp = await searchParams;

  const today = toDateInputValue(new Date());
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const from = sp.from || toDateInputValue(weekAgo);
  const to = sp.to || today;

  const where: Prisma.AttendanceEntryWhereInput = {
    date: { gte: new Date(`${from}T00:00:00`), lte: new Date(`${to}T23:59:59`) },
  };
  if (sp.employeeId) where.employeeId = sp.employeeId;
  if (sp.status) where.status = sp.status as AttendanceStatus;

  const [entries, employees] = await Promise.all([
    db.attendanceEntry.findMany({
      where,
      include: { employee: { select: { fullNameEn: true } } },
      orderBy: [{ date: "desc" }, { checkIn: "asc" }],
    }),
    getEmployeeOptions(),
  ]);

  const canEdit = can(user.role, "attendance", "edit");
  const canDelete = can(user.role, "attendance", "delete");

  return (
    <div>
      <PageHeader
        title={dict.attendance.title}
        description={dict.attendance.subtitle}
        actions={can(user.role, "attendance", "create") ? <CreateAttendanceButton employees={employees} defaultDate={today} /> : undefined}
      />

      <Card className="mb-4">
        <form method="get" className="flex flex-wrap items-end gap-3 p-4">
          <Select name="employeeId" defaultValue={sp.employeeId ?? ""} className="w-auto min-w-[180px]">
            <option value="">{dict.common.employee}: {dict.common.all}</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.fullNameEn}</option>
            ))}
          </Select>
          <div>
            <Input type="date" name="from" defaultValue={from} />
          </div>
          <div>
            <Input type="date" name="to" defaultValue={to} />
          </div>
          <Select name="status" defaultValue={sp.status ?? ""} className="w-auto">
            <option value="">{dict.common.status}: {dict.common.all}</option>
            {(["PRESENT", "LATE", "HALF_DAY", "ABSENT", "LEAVE", "HOLIDAY", "DAY_OFF"] as const).map((s) => (
              <option key={s} value={s}>{dict.statuses.attendanceStatus[s]}</option>
            ))}
          </Select>
          <Button type="submit" variant="secondary"><Search size={15} /> {dict.common.filter}</Button>
          <Button asChild type="button" variant="ghost">
            <Link href="/attendance">{dict.common.reset}</Link>
          </Button>
        </form>
      </Card>

      <Card>
        {entries.length === 0 ? (
          <div className="p-6">
            <EmptyState title={dict.attendance.noResults} />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.common.date}</TH>
                <TH>{dict.common.employee}</TH>
                <TH>{dict.attendance.checkIn}</TH>
                <TH>{dict.attendance.checkOut}</TH>
                <TH>{dict.attendance.breakMinutes}</TH>
                <TH>{dict.attendance.netDuration}</TH>
                <TH>{dict.common.status}</TH>
                <TH>{dict.common.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {entries.map((e) => (
                <TR key={e.id}>
                  <TD>{formatDate(e.date)}</TD>
                  <TD>
                    <Link href={`/employees/${e.employeeId}`} className="font-medium text-primary hover:underline">
                      {e.employee.fullNameEn}
                    </Link>
                  </TD>
                  <TD>{formatTime(e.checkIn)}</TD>
                  <TD>{formatTime(e.checkOut)}</TD>
                  <TD>{e.breakMinutes}</TD>
                  <TD><DurationBadge minutes={e.workedMinutes} /></TD>
                  <TD><StatusBadge status={e.status} label={dict.statuses.attendanceStatus[e.status]} /></TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      {canEdit && <EditAttendanceButton entry={e} employees={employees} />}
                      {canDelete && <DeleteAttendanceButton id={e.id} />}
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
