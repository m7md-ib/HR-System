"use client";

import { Plus, Check, X, Wallet } from "lucide-react";
import { FormDialog } from "@/components/crud/form-dialog";
import { ConfirmAction } from "@/components/crud/confirm-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { createExpense, approveExpense, rejectExpense, markExpensePaid } from "@/actions/expenses";
import { toDateInputValue } from "@/lib/format";
import type { EmployeeOption } from "@/lib/queries/employee-options";

export function CreateExpenseButton({ employees }: { employees: EmployeeOption[] }) {
  const { dict } = useI18n();
  return (
    <FormDialog trigger={<Button size="sm"><Plus size={16} /> {dict.expenses.create}</Button>} title={dict.expenses.create} onSubmit={createExpense}>
      <Field label={dict.common.employee} htmlFor="employeeId" required>
        <Select id="employeeId" name="employeeId" required>
          <option value="">{dict.common.selectPlaceholder}</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.fullNameEn} ({e.employeeNumber})</option>)}
        </Select>
      </Field>
      <Field label={dict.common.date} htmlFor="date" required>
        <Input id="date" name="date" type="date" required defaultValue={toDateInputValue(new Date())} />
      </Field>
      <Field label={dict.expenses.expenseType} htmlFor="expenseType" required>
        <Input id="expenseType" name="expenseType" required placeholder="Transportation, Supplies..." />
      </Field>
      <Field label={dict.common.amount} htmlFor="amount" required>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
      </Field>
      <Field label={dict.common.reason} htmlFor="reason">
        <Input id="reason" name="reason" />
      </Field>
      <Field label={dict.common.description} htmlFor="description">
        <Textarea id="description" name="description" />
      </Field>
      <Field label={dict.expenses.paidBy} htmlFor="paidBy">
        <Input id="paidBy" name="paidBy" />
      </Field>
      <Field label={dict.expenses.receipt} htmlFor="receipt">
        <Input id="receipt" name="receipt" type="file" accept="image/*,.pdf" />
      </Field>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="includeInPayroll" defaultChecked className="h-4 w-4 rounded border-border" />
        {dict.expenses.includeInPayroll}
      </label>
      <Field label={dict.common.notes} htmlFor="notes">
        <Textarea id="notes" name="notes" />
      </Field>
    </FormDialog>
  );
}

export function ApproveExpenseButton({ id }: { id: string }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-success hover:bg-success-soft" title={dict.expenses.approve}><Check size={15} /></Button>}
      onConfirm={() => approveExpense(id)}
      title={dict.expenses.approve}
      tone="primary"
    />
  );
}

export function RejectExpenseButton({ id }: { id: string }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft" title={dict.expenses.reject}><X size={15} /></Button>}
      onConfirm={() => rejectExpense(id)}
      title={dict.expenses.reject}
    />
  );
}

export function MarkExpensePaidButton({ id }: { id: string }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-primary hover:bg-primary-soft" title={dict.expenses.markPaid}><Wallet size={15} /></Button>}
      onConfirm={() => markExpensePaid(id)}
      title={dict.expenses.markPaid}
      tone="primary"
    />
  );
}
