import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { getEmployeeOptions } from "@/lib/queries/employee-options";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { CreateUserButton, EditUserButton, ToggleUserActiveButton } from "./user-dialogs";

export default async function UsersPage() {
  await requirePermission("users", "view");
  const { dict } = await getServerDictionary();

  const [users, employees] = await Promise.all([
    db.user.findMany({ include: { employee: true }, orderBy: { createdAt: "asc" } }),
    getEmployeeOptions(),
  ]);

  return (
    <div>
      <PageHeader title={dict.users.title} description={dict.users.subtitle} actions={<CreateUserButton employees={employees} />} />
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{dict.users.name}</TH>
              <TH>{dict.common.email}</TH>
              <TH>{dict.users.role}</TH>
              <TH>{dict.users.linkedEmployee}</TH>
              <TH>{dict.users.lastLogin}</TH>
              <TH>{dict.common.status}</TH>
              <TH>{dict.common.actions}</TH>
            </TR>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD className="font-medium">{u.name}</TD>
                <TD>{u.email}</TD>
                <TD>{dict.roles[u.role]}</TD>
                <TD>{u.employee?.fullNameEn ?? "—"}</TD>
                <TD className="text-xs">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : dict.users.never}</TD>
                <TD><Badge tone={u.isActive ? "success" : "neutral"}>{u.isActive ? dict.common.active : dict.common.inactive}</Badge></TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <EditUserButton userRow={u} employees={employees} />
                    <ToggleUserActiveButton id={u.id} isActive={u.isActive} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
