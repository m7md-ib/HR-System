"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Drawer = RadixDialog.Root;
export const DrawerTrigger = RadixDialog.Trigger;

export function DrawerContent({
  children,
  className,
  title,
  description,
}: {
  children: ReactNode;
  className?: string;
  title: string;
  description?: string;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <RadixDialog.Content
        className={cn(
          "fixed inset-y-0 end-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-s border-border bg-surface shadow-lg focus:outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <RadixDialog.Title className="text-base font-semibold text-foreground">{title}</RadixDialog.Title>
            {description && (
              <RadixDialog.Description className="mt-1 text-xs text-muted">{description}</RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close className="rounded-full p-1 text-muted hover:bg-muted-surface">
            <X size={16} />
          </RadixDialog.Close>
        </div>
        <div className="flex-1 p-5">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
