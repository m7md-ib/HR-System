import "server-only";
import { db } from "@/lib/db";
import type { NotificationType, Role } from "@/generated/prisma/client";

export async function notifyRoles(
  roles: Role[],
  params: { type: NotificationType; title: string; message: string; relatedEntityType?: string; relatedEntityId?: string },
) {
  await db.notification.createMany({
    data: roles.map((role) => ({
      targetRole: role,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
    })),
  });
}
