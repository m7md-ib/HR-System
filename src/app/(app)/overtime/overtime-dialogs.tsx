"use client";

import { Plus, Check, Trash2 } from "lucide-react";
import { FormDialog } from "@/components/crud/form-dialog";
import { ConfirmAction } from "@/components/crud/confirm-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { createOvertimeEntry, approveOvertimeEntry, voidOvertimeEntry } from "@/actions/overtime";
import { toDateInputValue } from "@/lib/format";
import type { EmployeeOption } from "@/lib/queries/employee-options";

export function CreateOvertimeButton({ employees, defaultMultiplier }: { employees: EmployeeOption[]; defaultMultiplier: string }) {
  const { dict } = useI18n();
  return (
    <FormDialog trigger={<Button size="sm"><Plus size={16} /> {dict.overtime.create}</Button>} title={dict.overtime.create} onSubmit={createOvertimeEntry}>
      <Field label={dict.common.employee} htmlFor="employeeId" required>
        <Select id="employeeId" name="employeeId" required>
          <option value="">{dict.common.selectPlaceholder}</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.fullNameEn} ({e.employeeNumber})</option>)}
        </Select>
      </Field>
      <Field label={dict.common.date} htmlFor="date" required>
        <Input id="date" name="date" type="date" required defaultValue={toDateInputValue(new Date())} />
      </Field>
      <Field label={dict.overtime.overtimeDuration} htmlFor="overtimeDuration" required hint="HH:MM">
        <Input id="overtimeDuration" name="overtimeDuration" placeholder="02:30" pattern="^\d{1,3}:[0-5]\d$" required />
      </Field>
      <Field label={dict.overtime.multiplier} htmlFor="multiplier">
        <Input id="multiplier" name="multiplier" type="number" step="0.1" min="1" defaultValue={defaultMultiplier} />
      </Field>
      <Field label={dict.common.notes} htmlFor="notes">
        <Textarea id="notes" name="notes" />
      </Field>
    </FormDialog>
  );
}

export function ApproveOvertimeButton({ id }: { id: string }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-success hover:bg-success-soft" title={dict.common.approve}><Check size={15} /></Button>}
      onConfirm={() => approveOvertimeEntry(id)}
      title={dict.common.approve}
      tone="primary"
    />
  );
}

export function VoidOvertimeButton({ id }: { id: string }) {
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft"><Trash2 size={15} /></Button>}
      onConfirm={() => voidOvertimeEntry(id)}
    />
  );
}
