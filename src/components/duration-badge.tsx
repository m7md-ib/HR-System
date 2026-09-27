import { minutesToDuration } from "@/lib/time/engine";
import { cn } from "@/lib/utils";

/** Always renders durations as HH:MM. Never pass decimal hours here. */
export function DurationBadge({ minutes, className }: { minutes: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-[var(--radius-sm)] bg-primary-soft px-2 py-0.5 font-mono text-sm font-semibold text-primary-dark", className)}>
      {minutesToDuration(minutes)}
    </span>
  );
}
