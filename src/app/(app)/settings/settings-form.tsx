"use client";

import { useTransition, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { updateSettings } from "@/actions/settings";
import type { Settings } from "@/generated/prisma/client";

type SerializedSettings = Omit<Settings, "overtimeMultiplier"> & { overtimeMultiplier: string };

export function SettingsForm({ settings }: { settings: SerializedSettings }) {
  const { dict } = useI18n();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleAction(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      await updateSettings(formData);
      setSaved(true);
    });
  }

  return (
    <form action={handleAction} className="flex flex-col gap-5">
      <Card>
        <CardHeader><CardTitle>{dict.settings.companyInfo}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={dict.settings.companyName} htmlFor="companyName" required>
            <Input id="companyName" name="companyName" required defaultValue={settings.companyName} />
          </Field>
          <Field label={dict.settings.companyNameAr} htmlFor="companyNameAr" required>
            <Input id="companyNameAr" name="companyNameAr" dir="rtl" required defaultValue={settings.companyNameAr} />
          </Field>
          <Field label={dict.settings.currency} htmlFor="currency" required>
            <Input id="currency" name="currency" required defaultValue={settings.currency} />
          </Field>
          <Field label={dict.settings.timezone} htmlFor="timezone" required>
            <Input id="timezone" name="timezone" required defaultValue={settings.timezone} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{dict.settings.payrollRules}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={dict.settings.weekStartsOn} htmlFor="weekStartsOn">
            <Select id="weekStartsOn" name="weekStartsOn" defaultValue={settings.weekStartsOn}>
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={6}>Saturday</option>
            </Select>
          </Field>
          <Field label={dict.settings.standardDailyMinutes} htmlFor="standardDailyMinutes">
            <Input id="standardDailyMinutes" name="standardDailyMinutes" type="number" min="1" defaultValue={settings.standardDailyMinutes} />
          </Field>
          <Field label={dict.settings.standardMonthlyDays} htmlFor="standardMonthlyDays">
            <Input id="standardMonthlyDays" name="standardMonthlyDays" type="number" min="1" defaultValue={settings.standardMonthlyDays} />
          </Field>
          <Field label={dict.settings.overtimeMultiplier} htmlFor="overtimeMultiplier">
            <Input id="overtimeMultiplier" name="overtimeMultiplier" type="number" step="0.1" min="1" defaultValue={settings.overtimeMultiplier} />
          </Field>
          <Field label={dict.settings.lateGraceMinutes} htmlFor="lateGraceMinutes">
            <Input id="lateGraceMinutes" name="lateGraceMinutes" type="number" min="0" defaultValue={settings.lateGraceMinutes} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? dict.common.loading : dict.settings.save}</Button>
        {saved && <span className="text-sm text-success">{dict.settings.saved}</span>}
      </div>
    </form>
  );
}
