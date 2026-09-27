import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "primary" | "accent" | "success" | "warning" | "danger";
  className?: string;
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-surface text-foreground",
    primary: "bg-primary text-primary-foreground",
    accent: "bg-accent text-white",
    success: "bg-success text-white",
    warning: "bg-warning text-white",
    danger: "bg-danger text-white",
  };
  const isColored = tone !== "default";

  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-3 rounded-[var(--radius-lg)] border border-border p-4 shadow-sm",
        toneClasses[tone],
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-xs font-medium", isColored ? "text-white/85" : "text-muted")}>{label}</span>
        {icon && <span className={cn(isColored ? "text-white/85" : "text-muted")}>{icon}</span>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <div className={cn("text-xs", isColored ? "text-white/75" : "text-muted")}>{hint}</div>}
    </div>
  );
}
