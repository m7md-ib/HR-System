"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { id, OR: [{ userId: user.id }, { userId: null, targetRole: user.role }] },
    data: { isRead: true },
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { isRead: false, OR: [{ userId: user.id }, { userId: null, targetRole: user.role }] },
    data: { isRead: true },
  });
  revalidatePath("/notifications");
}
