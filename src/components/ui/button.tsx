import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-dark shadow-sm",
  secondary: "bg-surface text-foreground border border-border hover:bg-muted-surface shadow-sm",
  outline: "bg-transparent text-primary border border-primary/30 hover:bg-primary-soft",
  ghost: "bg-transparent text-foreground hover:bg-muted-surface",
  danger: "bg-danger text-white hover:opacity-90 shadow-sm",
  link: "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
} as const;

const SIZES = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
  icon: "h-9 w-9 p-0",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] font-medium transition-colors",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          VARIANTS[variant],
          size !== "icon" && SIZES[size],
          size === "icon" && SIZES.icon,
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
