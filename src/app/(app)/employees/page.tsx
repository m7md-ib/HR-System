import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { getServerDictionary } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { StatusBadge } from "@/components/status-badge";
import type { EmployeeStatus, EmploymentType, Prisma } from "@/generated/prisma/client";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; department?: string; type?: string; status?: string }>;
}) {
  const user = await requirePermission("employees", "view");
  const { dict } = await getServerDictionary();
  const sp = await searchParams;

  const where: Prisma.EmployeeWhereInput = {};
  if (sp.q) {
    where.OR = [
      { fullNameEn: { contains: sp.q, mode: "insensitive" } },
      { fullNameAr: { contains: sp.q, mode: "insensitive" } },
      { employeeNumber: { contains: sp.q, mode: "insensitive" } },
      { phone: { contains: sp.q, mode: "insensitive" } },
    ];
  }
  if (sp.department) where.departmentId = sp.department;
  if (sp.type) where.employmentType = sp.type as EmploymentType;
  if (sp.status) where.status = sp.status as EmployeeStatus;

  const [employees, departments] = await Promise.all([
    db.employee.findMany({
      where,
      include: { department: true, position: true },
      orderBy: { createdAt: "desc" },
    }),
    db.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title={dict.employees.title}
        description={dict.employees.subtitle}
        actions={
          can(user.role, "employees", "create") ? (
            <Button asChild size="sm">
              <Link href="/employees/new">
                <Plus size={16} /> {dict.employees.create}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <form method="get" className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[220px] flex-1">
            <Input name="q" placeholder={dict.employees.searchPlaceholder} defaultValue={sp.q} />
          </div>
          <Select name="department" defaultValue={sp.department ?? ""} className="w-auto">
            <option value="">{dict.common.department}: {dict.common.all}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          <Select name="type" defaultValue={sp.type ?? ""} className="w-auto">
            <option value="">{dict.common.type}: {dict.common.all}</option>
            <option value="DAILY">{dict.statuses.employmentType.DAILY}</option>
            <option value="PART_TIME">{dict.statuses.employmentType.PART_TIME}</option>
            <option value="FULL_TIME">{dict.statuses.employmentType.FULL_TIME}</option>
          </Select>
          <Select name="status" defaultValue={sp.status ?? ""} className="w-auto">
            <option value="">{dict.common.status}: {dict.common.all}</option>
            <option value="ACTIVE">{dict.statuses.employeeStatus.ACTIVE}</option>
            <option value="INACTIVE">{dict.statuses.employeeStatus.INACTIVE}</option>
            <option value="ON_LEAVE">{dict.statuses.employeeStatus.ON_LEAVE}</option>
            <option value="TERMINATED">{dict.statuses.employeeStatus.TERMINATED}</option>
          </Select>
          <Button type="submit" variant="secondary" size="md">
            <Search size={15} /> {dict.common.filter}
          </Button>
          {(sp.q || sp.department || sp.type || sp.status) && (
            <Button asChild type="button" variant="ghost" size="md">
              <Link href="/employees">{dict.common.reset}</Link>
            </Button>
          )}
        </form>
      </Card>

      <Card>
        {employees.length === 0 ? (
          <div className="p-6">
            <EmptyState title={dict.employees.noResults} />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.employees.employeeNumber}</TH>
                <TH>{dict.common.employee}</TH>
                <TH>{dict.common.department}</TH>
                <TH>{dict.common.jobTitle}</TH>
                <TH>{dict.common.type}</TH>
                <TH>{dict.common.status}</TH>
              </TR>
            </THead>
            <TBody>
              {employees.map((e) => (
                <TR key={e.id} className="cursor-pointer">
                  <TD className="font-mono text-xs">{e.employeeNumber}</TD>
                  <TD>
                    <Link href={`/employees/${e.id}`} className="font-medium text-primary hover:underline">
                      {e.fullNameEn}
                    </Link>
                    <div className="text-xs text-muted">{e.fullNameAr}</div>
                  </TD>
                  <TD>{e.department?.name ?? "—"}</TD>
                  <TD>{e.position?.title ?? e.jobTitle ?? "—"}</TD>
                  <TD>{dict.statuses.employmentType[e.employmentType]}</TD>
                  <TD>
                    <StatusBadge status={e.status} label={dict.statuses.employeeStatus[e.status]} />
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
