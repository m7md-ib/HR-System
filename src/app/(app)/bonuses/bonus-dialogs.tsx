"use client";

import { Plus, Check, Trash2 } from "lucide-react";
import { FormDialog } from "@/components/crud/form-dialog";
import { ConfirmAction } from "@/components/crud/confirm-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Select } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { createBonus, approveBonus, voidBonus } from "@/actions/bonuses";
import { toDateInputValue } from "@/lib/format";
import type { EmployeeOption } from "@/lib/queries/employee-options";

export function CreateBonusButton({ employees }: { employees: EmployeeOption[] }) {
  const { dict } = useI18n();
  return (
    <FormDialog trigger={<Button size="sm"><Plus size={16} /> {dict.bonuses.create}</Button>} title={dict.bonuses.create} onSubmit={createBonus}>
      <Field label={dict.common.employee} htmlFor="employeeId" required>
        <Select id="employeeId" name="employeeId" required>
          <option value="">{dict.common.selectPlaceholder}</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.fullNameEn} ({e.employeeNumber})</option>)}
        </Select>
      </Field>
      <Field label={dict.common.date} htmlFor="date" required>
        <Input id="date" name="date" type="date" required defaultValue={toDateInputValue(new Date())} />
      </Field>
      <Field label={dict.bonuses.bonusType} htmlFor="type" required>
        <Input id="type" name="type" required defaultValue="Bonus" />
      </Field>
      <Field label={dict.common.amount} htmlFor="amount" required>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
      </Field>
      <Field label={dict.common.reason} htmlFor="reason">
        <Input id="reason" name="reason" />
      </Field>
      <Field label={dict.common.notes} htmlFor="notes">
        <Textarea id="notes" name="notes" />
      </Field>
    </FormDialog>
  );
}

export function ApproveBonusButton({ id }: { id: string }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-success hover:bg-success-soft" title={dict.common.approve}><Check size={15} /></Button>}
      onConfirm={() => approveBonus(id)}
      title={dict.common.approve}
      tone="primary"
    />
  );
}

export function VoidBonusButton({ id }: { id: string }) {
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft"><Trash2 size={15} /></Button>}
      onConfirm={() => voidBonus(id)}
    />
  );
}
