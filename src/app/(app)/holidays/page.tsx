import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { getServerDictionary } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { CreateHolidayButton, EditHolidayButton, DeleteHolidayButton } from "./holiday-dialogs";

export default async function HolidaysPage() {
  const user = await requirePermission("holidays", "view");
  const { dict } = await getServerDictionary();
  const canEdit = can(user.role, "holidays", "edit");
  const canDelete = can(user.role, "holidays", "delete");

  const holidays = await db.holiday.findMany({ orderBy: { date: "asc" } });

  return (
    <div>
      <PageHeader
        title={dict.holidays.title}
        description={dict.holidays.subtitle}
        actions={can(user.role, "holidays", "create") ? <CreateHolidayButton /> : undefined}
      />
      <Card>
        {holidays.length === 0 ? (
          <div className="p-6"><EmptyState title={dict.holidays.noResults} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.common.date}</TH>
                <TH>{dict.holidays.name}</TH>
                <TH>{dict.holidays.nameAr}</TH>
                <TH>{dict.holidays.holidayType}</TH>
                <TH>{dict.holidays.isPaid}</TH>
                <TH>{dict.common.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {holidays.map((h) => (
                <TR key={h.id}>
                  <TD>{formatDate(h.date)}</TD>
                  <TD className="font-medium">{h.name}</TD>
                  <TD>{h.nameAr ?? "—"}</TD>
                  <TD>{h.type ?? "—"}</TD>
                  <TD><Badge tone={h.isPaid ? "success" : "neutral"}>{h.isPaid ? dict.common.yes : dict.common.no}</Badge></TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      {canEdit && <EditHolidayButton holiday={h} />}
                      {canDelete && <DeleteHolidayButton id={h.id} />}
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
