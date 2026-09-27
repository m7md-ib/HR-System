"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

export function ConfirmAction({
  onConfirm,
  trigger,
  title,
  description,
  confirmLabel,
  tone = "danger",
}: {
  onConfirm: () => Promise<void>;
  trigger: ReactNode;
  title?: string;
  description?: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
}) {
  const { dict } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={title ?? dict.common.confirmDeleteTitle} description={description ?? dict.common.confirmDeleteBody}>
        {error && <p className="mb-3 rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            {dict.common.cancel}
          </Button>
          <Button
            type="button"
            variant={tone}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await onConfirm();
                  setOpen(false);
                } catch (e) {
                  setError(e instanceof Error ? e.message : dict.common.unexpectedError);
                }
              })
            }
          >
            {pending ? dict.common.loading : (confirmLabel ?? dict.common.confirm)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
