import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-neutral-soft text-muted",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  primary: "bg-primary-soft text-primary-dark",
  accent: "bg-accent-soft text-accent",
} as const;

export type BadgeTone = keyof typeof TONES;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
