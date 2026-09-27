import { Bell } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MarkAllReadButton, MarkReadButton } from "./notification-actions";

const ENTITY_LINK: Record<string, (id: string) => string> = {
  LeaveRequest: () => "/leave",
  EmployeeExpense: () => "/expenses",
  PayrollPeriod: (id) => `/payroll/${id}`,
  Advance: () => "/advances",
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const { dict } = await getServerDictionary();

  const notifications = await db.notification.findMany({
    where: { OR: [{ userId: user.id }, { userId: null, targetRole: user.role }] },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <PageHeader
        title={dict.notifications.title}
        description={dict.notifications.subtitle}
        actions={unreadCount > 0 ? <MarkAllReadButton /> : undefined}
      />
      <Card>
        {notifications.length === 0 ? (
          <div className="p-6"><EmptyState title={dict.notifications.empty} /></div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const href = n.relatedEntityType && n.relatedEntityId ? ENTITY_LINK[n.relatedEntityType]?.(n.relatedEntityId) : undefined;
              return (
                <li key={n.id} className={cn("flex items-start gap-3 p-4", !n.isRead && "bg-primary-soft/40")}>
                  <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", n.isRead ? "bg-muted-surface text-muted" : "bg-primary-soft text-primary-dark")}>
                    <Bell size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    {href ? (
                      <a href={href} className="text-sm font-semibold text-foreground hover:underline">{n.title}</a>
                    ) : (
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    )}
                    <p className="text-sm text-muted">{n.message}</p>
                    <p className="mt-1 text-xs text-muted">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <MarkReadButton id={n.id} />}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
