"use client";

import { Plus, HandCoins, Ban } from "lucide-react";
import { FormDialog } from "@/components/crud/form-dialog";
import { ConfirmAction } from "@/components/crud/confirm-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { createAdvance, cancelAdvance, recordAdvanceDeduction } from "@/actions/advances";
import { toDateInputValue } from "@/lib/format";
import type { EmployeeOption } from "@/lib/queries/employee-options";

export function CreateAdvanceButton({ employees }: { employees: EmployeeOption[] }) {
  const { dict } = useI18n();
  return (
    <FormDialog
      trigger={<Button size="sm"><Plus size={16} /> {dict.advances.create}</Button>}
      title={dict.advances.create}
      onSubmit={createAdvance}
    >
      <Field label={dict.common.employee} htmlFor="employeeId" required>
        <Select id="employeeId" name="employeeId" required>
          <option value="">{dict.common.selectPlaceholder}</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.fullNameEn} ({e.employeeNumber})</option>
          ))}
        </Select>
      </Field>
      <Field label={dict.advances.issuedOn} htmlFor="date" required>
        <Input id="date" name="date" type="date" required defaultValue={toDateInputValue(new Date())} />
      </Field>
      <Field label={dict.common.amount} htmlFor="amount" required>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={dict.advances.paymentMethod} htmlFor="paymentMethod">
          <Select id="paymentMethod" name="paymentMethod" defaultValue="CASH">
            <option value="CASH">{dict.statuses.paymentMethod.CASH}</option>
            <option value="BANK_TRANSFER">{dict.statuses.paymentMethod.BANK_TRANSFER}</option>
            <option value="OTHER">{dict.statuses.paymentMethod.OTHER}</option>
          </Select>
        </Field>
        <Field label={dict.advances.deductionMethod} htmlFor="deductionMethod">
          <Select id="deductionMethod" name="deductionMethod" defaultValue="INSTALLMENTS">
            <option value="FULL">{dict.advances.deductionMethodFull}</option>
            <option value="INSTALLMENTS">{dict.advances.deductionMethodInstallments}</option>
          </Select>
        </Field>
      </div>
      <Field label={dict.advances.installments} htmlFor="installments">
        <Input id="installments" name="installments" type="number" min="1" defaultValue="1" />
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

export function RecordDeductionButton({ advanceId, remainingBalance }: { advanceId: string; remainingBalance: string }) {
  const { dict } = useI18n();
  return (
    <FormDialog
      trigger={<Button size="icon" variant="ghost" title={dict.advances.recordDeduction}><HandCoins size={15} /></Button>}
      title={dict.advances.recordDeduction}
      onSubmit={recordAdvanceDeduction.bind(null, advanceId)}
    >
      <Field label={dict.common.date} htmlFor="date" required>
        <Input id="date" name="date" type="date" required defaultValue={toDateInputValue(new Date())} />
      </Field>
      <Field label={dict.common.amount} htmlFor="amount" required hint={`${dict.advances.remainingBalance}: ${remainingBalance}`}>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" max={remainingBalance} required />
      </Field>
      <Field label={dict.common.notes} htmlFor="notes">
        <Textarea id="notes" name="notes" />
      </Field>
    </FormDialog>
  );
}

export function CancelAdvanceButton({ id }: { id: string }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft" title={dict.advances.cancelAdvance}><Ban size={15} /></Button>}
      onConfirm={() => cancelAdvance(id)}
      title={dict.advances.cancelAdvance}
    />
  );
}
