import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { getServerDictionary } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { CreatePositionButton, DeletePositionButton, EditPositionButton } from "./position-dialogs";

export default async function PositionsPage() {
  const user = await requirePermission("positions", "view");
  const { dict } = await getServerDictionary();
  const canEdit = can(user.role, "positions", "edit");
  const canDelete = can(user.role, "positions", "delete");

  const [positions, departments] = await Promise.all([
    db.position.findMany({
      orderBy: { title: "asc" },
      include: { department: true, _count: { select: { employees: true } } },
    }),
    db.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title={dict.positions.title}
        description={dict.positions.subtitle}
        actions={can(user.role, "positions", "create") ? <CreatePositionButton departments={departments} /> : undefined}
      />
      <Card>
        {positions.length === 0 ? (
          <div className="p-6">
            <EmptyState title={dict.common.noData} />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.positions.titleEn}</TH>
                <TH>{dict.positions.titleAr}</TH>
                <TH>{dict.common.department}</TH>
                <TH>{dict.departments.employeesCount}</TH>
                <TH>{dict.common.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {positions.map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium">{p.title}</TD>
                  <TD>{p.titleAr ?? "—"}</TD>
                  <TD>{p.department?.name ?? "—"}</TD>
                  <TD>{p._count.employees}</TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      {canEdit && <EditPositionButton position={p} departments={departments} />}
                      {canDelete && <DeletePositionButton id={p.id} />}
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
