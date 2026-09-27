"use client";

import { Plus, Wallet, Ban } from "lucide-react";
import { FormDialog } from "@/components/crud/form-dialog";
import { ConfirmAction } from "@/components/crud/confirm-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { createPayment, voidPayment } from "@/actions/payments";
import { toDateInputValue } from "@/lib/format";
import type { EmployeeOption } from "@/lib/queries/employee-options";

export function CreatePaymentButton({ employees }: { employees: EmployeeOption[] }) {
  const { dict } = useI18n();
  return (
    <FormDialog trigger={<Button size="sm"><Plus size={16} /> {dict.payments.create}</Button>} title={dict.payments.create} onSubmit={createPayment}>
      <Field label={dict.common.employee} htmlFor="employeeId" required>
        <Select id="employeeId" name="employeeId" required>
          <option value="">{dict.common.selectPlaceholder}</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.fullNameEn} ({e.employeeNumber})</option>)}
        </Select>
      </Field>
      <Field label={dict.common.date} htmlFor="paymentDate" required>
        <Input id="paymentDate" name="paymentDate" type="date" required defaultValue={toDateInputValue(new Date())} />
      </Field>
      <Field label={dict.common.amount} htmlFor="amount" required>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
      </Field>
      <Field label={dict.common.method} htmlFor="paymentMethod">
        <Select id="paymentMethod" name="paymentMethod" defaultValue="CASH">
          <option value="CASH">{dict.statuses.paymentMethod.CASH}</option>
          <option value="BANK_TRANSFER">{dict.statuses.paymentMethod.BANK_TRANSFER}</option>
          <option value="OTHER">{dict.statuses.paymentMethod.OTHER}</option>
        </Select>
      </Field>
      <Field label={dict.common.referenceNumber} htmlFor="referenceNumber">
        <Input id="referenceNumber" name="referenceNumber" />
      </Field>
      <Field label={dict.common.notes} htmlFor="notes">
        <Textarea id="notes" name="notes" />
      </Field>
    </FormDialog>
  );
}

export function RecordPaymentButton({ employeeId, payrollRecordId, remainingAmount }: { employeeId: string; payrollRecordId: string; remainingAmount: string }) {
  const { dict } = useI18n();
  return (
    <FormDialog
      trigger={<Button size="sm"><Wallet size={15} /> {dict.payroll.recordPayment}</Button>}
      title={dict.payroll.recordPayment}
      onSubmit={createPayment}
    >
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="payrollRecordId" value={payrollRecordId} />
      <Field label={dict.common.date} htmlFor="paymentDate" required>
        <Input id="paymentDate" name="paymentDate" type="date" required defaultValue={toDateInputValue(new Date())} />
      </Field>
      <Field label={dict.common.amount} htmlFor="amount" required hint={`${dict.payroll.remainingAmount}: ${remainingAmount}`}>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" max={remainingAmount} required defaultValue={remainingAmount} />
      </Field>
      <Field label={dict.common.method} htmlFor="paymentMethod">
        <Select id="paymentMethod" name="paymentMethod" defaultValue="CASH">
          <option value="CASH">{dict.statuses.paymentMethod.CASH}</option>
          <option value="BANK_TRANSFER">{dict.statuses.paymentMethod.BANK_TRANSFER}</option>
          <option value="OTHER">{dict.statuses.paymentMethod.OTHER}</option>
        </Select>
      </Field>
      <Field label={dict.common.referenceNumber} htmlFor="referenceNumber">
        <Input id="referenceNumber" name="referenceNumber" />
      </Field>
    </FormDialog>
  );
}

export function VoidPaymentButton({ id }: { id: string }) {
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft"><Ban size={15} /></Button>}
      onConfirm={() => voidPayment(id)}
    />
  );
}
