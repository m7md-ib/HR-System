"use client";

import { useTransition } from "react";
import { Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";

export function MarkAllReadButton() {
  const { dict } = useI18n();
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" variant="secondary" disabled={pending} onClick={() => startTransition(() => markAllNotificationsRead())}>
      <CheckCheck size={15} /> {dict.notifications.markAllRead}
    </Button>
  );
}

export function MarkReadButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button size="icon" variant="ghost" disabled={pending} onClick={() => startTransition(() => markNotificationRead(id))}>
      <Check size={15} />
    </Button>
  );
}
