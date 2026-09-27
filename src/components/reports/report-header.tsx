import { formatDateTime } from "@/lib/format";

export function ReportPrintHeader({
  companyName,
  reportName,
  rangeSummary,
  filtersSummary,
}: {
  companyName: string;
  reportName: string;
  rangeSummary?: string;
  filtersSummary?: string;
}) {
  return (
    <div className="mb-4 border-b border-border pb-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-foreground">{companyName}</p>
          <p className="text-sm font-medium text-muted">{reportName}</p>
        </div>
        <div className="text-end text-xs text-muted">
          <p>{formatDateTime(new Date())}</p>
          {rangeSummary && <p>{rangeSummary}</p>}
        </div>
      </div>
      {filtersSummary && <p className="mt-2 text-xs text-muted">{filtersSummary}</p>}
    </div>
  );
}
