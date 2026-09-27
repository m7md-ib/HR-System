"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setLocaleAction } from "@/actions/locale";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";

export function LanguageSwitch() {
  const { locale } = useI18n();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => setLocaleAction(locale === "ar" ? "en" : "ar"))}
      title={locale === "ar" ? "English" : "العربية"}
    >
      <Languages size={16} />
      {locale === "ar" ? "EN" : "AR"}
    </Button>
  );
}
