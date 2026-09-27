"use client";

import { Printer, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

export function PrintButton() {
  const { dict } = useI18n();
  return (
    <Button type="button" variant="secondary" size="sm" className="no-print" onClick={() => window.print()}>
      <Printer size={15} /> {dict.common.print}
    </Button>
  );
}

export function ExportExcelLink({ href }: { href: string }) {
  const { dict } = useI18n();
  return (
    <Button asChild type="button" variant="secondary" size="sm" className="no-print">
      <a href={href}>
        <FileDown size={15} /> {dict.common.exportExcel}
      </a>
    </Button>
  );
}
