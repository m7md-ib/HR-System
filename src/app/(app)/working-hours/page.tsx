import { startOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { getSettings } from "@/lib/queries/attendance";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { DurationBadge } from "@/components/duration-badge";
import { formatDate, toDateInputValue } from "@/lib/format";
import { minutesToDecimalHours, sumDurations } from "@/lib/time/engine";
import Link from "next/link";
import { Search } from "lucide-react";

type GroupBy = "daily" | "weekly" | "monthly";

export default async function WorkingHoursPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string; from?: string; to?: string; groupBy?: GroupBy }>;
}) {
  const user = await requirePermission("attendance", "view");
  void user;
  const { dict } = await getServerDictionary();
  const sp = await searchParams;

  const groupBy: GroupBy = sp.groupBy ?? "weekly";
  const today = new Date();
  const from = sp.from ? new Date(`${sp.from}T00:00:00`) : startOfMonth(today);
  const to = sp.to ? new Date(`${sp.to}T23:59:59`) : endOfMonth(today);

  const [entries, employees, settings] = await Promise.all([
    db.attendanceEntry.findMany({
      where: {
        date: { gte: from, lte: to },
        employeeId: sp.employeeId || undefined,
      },
      include: { employee: true },
    }),
    db.employee.findMany({ orderBy: { fullNameEn: "asc" } }),
    getSettings(),
  ]);

  const weekStartsOn = settings.weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  function bucketKeyAndLabel(date: Date): { key: string; label: string; sortDate: Date } {
    if (groupBy === "daily") {
      return { key: format(date, "yyyy-MM-dd"), label: formatDate(date), sortDate: date };
    }
    if (groupBy === "weekly") {
      const start = startOfWeek(date, { weekStartsOn });
      return { key: format(start, "yyyy-MM-dd"), label: `${dict.common.from} ${formatDate(start)}`, sortDate: start };
    }
    const start = startOfMonth(date);
    return { key: format(start, "yyyy-MM"), label: format(start, "yyyy-MM"), sortDate: start };
  }

  const buckets = new Map<
    string,
    { employeeId: string; employeeName: string; label: string; sortDate: Date; minutes: number[]; shifts: number }
  >();

  for (const entry of entries) {
    const { key, label, sortDate } = bucketKeyAndLabel(entry.date);
    const mapKey = `${entry.employeeId}__${key}`;
    const existing = buckets.get(mapKey);
    if (existing) {
      existing.minutes.push(entry.workedMinutes);
      existing.shifts += 1;
    } else {
      buckets.set(mapKey, {
        employeeId: entry.employeeId,
        employeeName: entry.employee.fullNameEn,
        label,
        sortDate,
        minutes: [entry.workedMinutes],
        shifts: 1,
      });
    }
  }

  const rows = Array.from(buckets.values())
    .map((b) => ({ ...b, total: sumDurations(...b.minutes) }))
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime() || a.employeeName.localeCompare(b.employeeName));

  const grandTotal = sumDurations(...rows.map((r) => r.total));

  return (
    <div>
      <PageHeader title={dict.workingHours.title} description={dict.workingHours.subtitle} />

      <Card className="mb-4">
        <form method="get" className="flex flex-wrap items-end gap-3 p-4">
          <Select name="employeeId" defaultValue={sp.employeeId ?? ""} className="w-auto min-w-[180px]">
            <option value="">{dict.common.employee}: {dict.common.all}</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.fullNameEn}</option>
            ))}
          </Select>
          <Input type="date" name="from" defaultValue={toDateInputValue(from)} />
          <Input type="date" name="to" defaultValue={toDateInputValue(to)} />
          <Select name="groupBy" defaultValue={groupBy} className="w-auto">
            <option value="daily">{dict.workingHours.daily}</option>
            <option value="weekly">{dict.workingHours.weekly}</option>
            <option value="monthly">{dict.workingHours.monthly}</option>
          </Select>
          <Button type="submit" variant="secondary"><Search size={15} /> {dict.common.filter}</Button>
          <Button asChild type="button" variant="ghost">
            <Link href="/working-hours">{dict.common.reset}</Link>
          </Button>
        </form>
      </Card>

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <span className="text-sm font-medium text-muted">{dict.common.totalWorkingHours}</span>
        <div className="flex items-center gap-3">
          <DurationBadge minutes={grandTotal} className="text-lg" />
          <span className="text-xs text-muted">({minutesToDecimalHours(grandTotal)} {dict.workingHours.decimalHoursNote})</span>
        </div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title={dict.common.noData} />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.common.period}</TH>
                <TH>{dict.common.employee}</TH>
                <TH>{dict.workingHours.shiftsCount}</TH>
                <TH>{dict.common.totalWorkingTime}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r, i) => (
                <TR key={i}>
                  <TD>{r.label}</TD>
                  <TD>
                    <Link href={`/employees/${r.employeeId}`} className="font-medium text-primary hover:underline">
                      {r.employeeName}
                    </Link>
                  </TD>
                  <TD>{r.shifts}</TD>
                  <TD><DurationBadge minutes={r.total} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
