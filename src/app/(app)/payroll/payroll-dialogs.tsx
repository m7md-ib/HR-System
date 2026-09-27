"use client";

import { Plus, Play, CheckCircle2, Lock } from "lucide-react";
import { FormDialog } from "@/components/crud/form-dialog";
import { ConfirmAction } from "@/components/crud/confirm-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { createPayrollPeriod, generatePayroll, approvePayrollPeriod, closePayrollPeriod } from "@/actions/payroll";
import { toDateInputValue } from "@/lib/format";

export function CreatePayrollPeriodButton() {
  const { dict } = useI18n();
  return (
    <FormDialog trigger={<Button size="sm"><Plus size={16} /> {dict.payroll.createPeriod}</Button>} title={dict.payroll.createPeriod} onSubmit={createPayrollPeriod}>
      <Field label={dict.payroll.periodType} htmlFor="periodType" required>
        <Select id="periodType" name="periodType" required defaultValue="MONTHLY">
          <option value="DAILY">{dict.statuses.payrollType.DAILY}</option>
          <option value="WEEKLY">{dict.statuses.payrollType.WEEKLY}</option>
          <option value="MONTHLY">{dict.statuses.payrollType.MONTHLY}</option>
        </Select>
      </Field>
      <Field label={dict.payroll.label} htmlFor="label" required>
        <Input id="label" name="label" required placeholder="September 2026" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={dict.common.startDate} htmlFor="startDate" required>
          <Input id="startDate" name="startDate" type="date" required defaultValue={toDateInputValue(new Date())} />
        </Field>
        <Field label={dict.common.endDate} htmlFor="endDate" required>
          <Input id="endDate" name="endDate" type="date" required defaultValue={toDateInputValue(new Date())} />
        </Field>
      </div>
    </FormDialog>
  );
}

export function GeneratePayrollButton({ periodId }: { periodId: string }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={<Button size="sm"><Play size={15} /> {dict.payroll.generate}</Button>}
      onConfirm={() => generatePayroll(periodId)}
      title={dict.payroll.generateConfirmTitle}
      description={dict.payroll.generateConfirmBody}
      confirmLabel={dict.payroll.generate}
      tone="primary"
    />
  );
}

export function ApprovePeriodButton({ periodId }: { periodId: string }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={<Button size="sm" variant="secondary"><CheckCircle2 size={15} /> {dict.payroll.approve}</Button>}
      onConfirm={() => approvePayrollPeriod(periodId)}
      title={dict.payroll.approve}
      confirmLabel={dict.common.approve}
      tone="primary"
    />
  );
}

export function ClosePeriodButton({ periodId }: { periodId: string }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={<Button size="sm" variant="secondary"><Lock size={15} /> {dict.payroll.close}</Button>}
      onConfirm={() => closePayrollPeriod(periodId)}
      title={dict.payroll.close}
      confirmLabel={dict.payroll.close}
    />
  );
}
