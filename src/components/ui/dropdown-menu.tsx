"use client";

import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({ className, ...props }: React.ComponentProps<typeof RadixDropdown.Content>) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align="end"
        sideOffset={6}
        className={cn(
          "z-50 min-w-[180px] rounded-[var(--radius-md)] border border-border bg-surface p-1 shadow-lg",
          className,
        )}
        {...props}
      />
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof RadixDropdown.Item>) {
  return (
    <RadixDropdown.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-foreground outline-none",
        "data-[highlighted]:bg-muted-surface",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof RadixDropdown.Separator>) {
  return <RadixDropdown.Separator className={cn("my-1 h-px bg-border", className)} {...props} />;
}
