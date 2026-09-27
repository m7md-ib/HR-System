import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { getSettings } from "@/lib/queries/attendance";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TFoot, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportPrintHeader } from "@/components/reports/report-header";
import { PrintButton, ExportExcelLink } from "@/components/reports/report-toolbar";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";

export default async function AdvanceBalanceReportPage() {
  await requirePermission("reports", "view");
  const { dict } = await getServerDictionary();
  const settings = await getSettings();

  const advances = await db.advance.findMany({
    where: { status: { in: ["ACTIVE", "PARTIALLY_SETTLED"] } },
    include: { employee: true },
    orderBy: { date: "asc" },
  });
  const total = advances.reduce((s, a) => s + Number(a.remainingBalance), 0);

  return (
    <div>
      <PageHeader
        title={dict.reports.advanceBalance}
        actions={<><PrintButton /><ExportExcelLink href="/api/reports/advance-balance" /></>}
      />
      <div className="print-full-width">
        <ReportPrintHeader companyName={settings.companyName} reportName={dict.reports.advanceBalance} />
        <Card>
          {advances.length === 0 ? <div className="p-6"><EmptyState title={dict.advances.noResults} /></div> : (
            <Table>
              <THead><TR><TH>{dict.advances.issuedOn}</TH><TH>{dict.common.employee}</TH><TH>{dict.common.amount}</TH><TH>{dict.advances.remainingBalance}</TH><TH>{dict.common.status}</TH></TR></THead>
              <TBody>
                {advances.map((a) => (
                  <TR key={a.id}>
                    <TD>{formatDate(a.date)}</TD><TD>{a.employee.fullNameEn}</TD><TD>{formatMoney(a.amount)}</TD>
                    <TD className="font-semibold">{formatMoney(a.remainingBalance)}</TD>
                    <TD><StatusBadge status={a.status} label={dict.statuses.advanceStatus[a.status]} /></TD>
                  </TR>
                ))}
              </TBody>
              <TFoot><TR><TD colSpan={3}>{dict.common.total}</TD><TD>{formatMoney(total)}</TD><TD /></TR></TFoot>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
