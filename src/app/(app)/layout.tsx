import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const unreadCount = await db.notification.count({
    where: {
      isRead: false,
      OR: [{ userId: user.id }, { userId: null, targetRole: user.role }],
    },
  });

  return (
    <AppShell role={user.role} name={user.name} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
