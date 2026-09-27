import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import type { AuditAction, Prisma } from "@/generated/prisma/client";
import Link from "next/link";

const ACTION_TONE: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "danger",
  APPROVE: "success",
  REJECT: "danger",
  VOID: "warning",
  PAY: "success",
  LOGIN: "neutral",
  LOGOUT: "neutral",
};

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ entityType?: string; action?: string }> }) {
  await requirePermission("audit", "view");
  const { dict } = await getServerDictionary();
  const sp = await searchParams;

  const where: Prisma.AuditLogWhereInput = {};
  if (sp.entityType) where.entityType = sp.entityType;
  if (sp.action) where.action = sp.action as AuditAction;

  const [logs, entityTypes] = await Promise.all([
    db.auditLog.findMany({ where, include: { user: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true } }),
  ]);

  return (
    <div>
      <PageHeader title={dict.auditLog.title} description={dict.auditLog.subtitle} />
      <Card className="mb-4">
        <form method="get" className="flex flex-wrap items-end gap-3 p-4">
          <Select name="entityType" defaultValue={sp.entityType ?? ""} className="w-auto">
            <option value="">{dict.auditLog.entity}: {dict.common.all}</option>
            {entityTypes.map((e) => <option key={e.entityType} value={e.entityType}>{e.entityType}</option>)}
          </Select>
          <Select name="action" defaultValue={sp.action ?? ""} className="w-auto">
            <option value="">{dict.auditLog.action}: {dict.common.all}</option>
            {Object.keys(ACTION_TONE).map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Button type="submit" variant="secondary" size="md">{dict.common.filter}</Button>
          <Button asChild type="button" variant="ghost" size="md"><Link href="/audit-log">{dict.common.reset}</Link></Button>
        </form>
      </Card>
      <Card>
        {logs.length === 0 ? (
          <div className="p-6"><EmptyState title={dict.auditLog.noResults} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{dict.auditLog.when}</TH>
                <TH>{dict.auditLog.user}</TH>
                <TH>{dict.auditLog.action}</TH>
                <TH>{dict.auditLog.entity}</TH>
                <TH>{dict.common.description}</TH>
              </TR>
            </THead>
            <TBody>
              {logs.map((log) => (
                <TR key={log.id}>
                  <TD className="text-xs">{formatDateTime(log.createdAt)}</TD>
                  <TD>{log.user?.name ?? "System"}</TD>
                  <TD><Badge tone={ACTION_TONE[log.action] ?? "neutral"}>{log.action}</Badge></TD>
                  <TD>{log.entityType}</TD>
                  <TD className="max-w-md truncate text-xs text-muted">{log.description ?? "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
