"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

export function FormDialog({
  trigger,
  title,
  description,
  submitLabel,
  onSubmit,
  children,
  className,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  submitLabel?: string;
  onSubmit: (formData: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
}) {
  const { dict } = useI18n();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit(formData);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : dict.common.unexpectedError);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={title} description={description} className={className}>
        <form action={handleAction} className="flex flex-col gap-4">
          {children}
          {error && <p className="rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? dict.common.loading : (submitLabel ?? dict.common.save)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
