"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { FormDialog } from "@/components/crud/form-dialog";
import { ConfirmAction } from "@/components/crud/confirm-action";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { createHoliday, deleteHoliday, updateHoliday } from "@/actions/holidays";
import { toDateInputValue } from "@/lib/format";
import type { Holiday } from "@/generated/prisma/client";

function Fields({ holiday }: { holiday?: Holiday }) {
  const { dict } = useI18n();
  return (
    <>
      <Field label={dict.holidays.name} htmlFor="name" required>
        <Input id="name" name="name" required defaultValue={holiday?.name} />
      </Field>
      <Field label={dict.holidays.nameAr} htmlFor="nameAr">
        <Input id="nameAr" name="nameAr" dir="rtl" defaultValue={holiday?.nameAr ?? ""} />
      </Field>
      <Field label={dict.common.date} htmlFor="date" required>
        <Input id="date" name="date" type="date" required defaultValue={toDateInputValue(holiday?.date) || toDateInputValue(new Date())} />
      </Field>
      <Field label={dict.holidays.holidayType} htmlFor="type">
        <Input id="type" name="type" defaultValue={holiday?.type ?? ""} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isPaid" defaultChecked={holiday?.isPaid ?? true} className="h-4 w-4 rounded border-border" />
        {dict.holidays.isPaid}
      </label>
    </>
  );
}

export function CreateHolidayButton() {
  const { dict } = useI18n();
  return (
    <FormDialog trigger={<Button size="sm"><Plus size={16} /> {dict.holidays.create}</Button>} title={dict.holidays.create} onSubmit={createHoliday}>
      <Fields />
    </FormDialog>
  );
}

export function EditHolidayButton({ holiday }: { holiday: Holiday }) {
  const { dict } = useI18n();
  return (
    <FormDialog
      trigger={<Button size="icon" variant="ghost" title={dict.common.edit}><Pencil size={15} /></Button>}
      title={dict.holidays.edit}
      onSubmit={updateHoliday.bind(null, holiday.id)}
    >
      <Fields holiday={holiday} />
    </FormDialog>
  );
}

export function DeleteHolidayButton({ id }: { id: string }) {
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft"><Trash2 size={15} /></Button>}
      onConfirm={() => deleteHoliday(id)}
    />
  );
}
