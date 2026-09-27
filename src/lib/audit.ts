import "server-only";
import { db } from "@/lib/db";
import type { AuditAction, Prisma } from "@/generated/prisma/client";

export async function logAudit(params: {
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  oldValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
  description?: string;
}) {
  await db.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      oldValue: params.oldValue ?? undefined,
      newValue: params.newValue ?? undefined,
      description: params.description,
    },
  });
}
