"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn("inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-muted-surface p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium text-muted transition-colors",
        "data-[state=active]:bg-surface data-[state=active]:text-primary-dark data-[state=active]:shadow-sm",
        "hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn("mt-4 focus:outline-none", className)} {...props} />;
}
