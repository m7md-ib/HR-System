"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
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
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
      <RadixDialog.Content
        className={cn(
          "fixed start-1/2 top-1/2 z-50 max-h-[90vh] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-lg focus:outline-none rtl:translate-x-1/2",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
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
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
