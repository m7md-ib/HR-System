import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { getServerDictionary } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateDepartmentButton, DeleteDepartmentButton, EditDepartmentButton } from "./department-dialogs";

export default async function DepartmentsPage() {
  const user = await requirePermission("departments", "view");
  const { dict } = await getServerDictionary();
  const canEdit = can(user.role, "departments", "edit");
  const canDelete = can(user.role, "departments", "delete");

  const departments = await db.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { employees: true, positions: true } } },
  });

  return (
    <div>
      <PageHeader
        title={dict.departments.title}
        description={dict.departments.subtitle}
        actions={can(user.role, "departments", "create") ? <CreateDepartmentButton /> : undefined}
      />
      <Card>
        {departments.length === 0 ? (
          <div className="p-6">
            <EmptyState title={dict.common.noData} />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.departments.nameEn}</TH>
                <TH>{dict.departments.nameAr}</TH>
                <TH>{dict.departments.employeesCount}</TH>
                <TH>{dict.common.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {departments.map((d) => (
                <TR key={d.id}>
                  <TD className="font-medium">{d.name}</TD>
                  <TD>{d.nameAr ?? "—"}</TD>
                  <TD>{d._count.employees}</TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      {canEdit && <EditDepartmentButton department={d} />}
                      {canDelete && <DeleteDepartmentButton id={d.id} />}
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
