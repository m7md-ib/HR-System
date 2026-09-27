import type { BadgeTone } from "@/components/ui/badge";

const TONE_MAP: Record<string, BadgeTone> = {
  ACTIVE: "success",
  PRESENT: "success",
  APPROVED: "success",
  PAID: "success",
  SETTLED: "success",
  CALCULATED: "info",
  REVIEWED: "info",
  INCLUDED_IN_PAYROLL: "info",
  LEAVE: "info",
  INACTIVE: "neutral",
  ON_LEAVE: "warning",
  TERMINATED: "danger",
  ABSENT: "danger",
  LATE: "warning",
  HALF_DAY: "warning",
  HOLIDAY: "primary",
  DAY_OFF: "neutral",
  DRAFT: "neutral",
  CLOSED: "neutral",
  VOID: "danger",
  PARTIALLY_SETTLED: "warning",
  PARTIALLY_PAID: "warning",
  CANCELLED: "danger",
  PENDING: "warning",
  REJECTED: "danger",
  UNPAID: "danger",
};

export function statusTone(status: string): BadgeTone {
  return TONE_MAP[status] ?? "neutral";
}
