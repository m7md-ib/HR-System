"use client";

import { Plus, Check, X, Ban } from "lucide-react";
import { FormDialog } from "@/components/crud/form-dialog";
import { ConfirmAction } from "@/components/crud/confirm-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { createLeaveRequest, approveLeaveRequest, rejectLeaveRequest, cancelLeaveRequest } from "@/actions/leave";
import { toDateInputValue } from "@/lib/format";
import type { EmployeeOption } from "@/lib/queries/employee-options";

const TYPES = ["ANNUAL", "SICK", "EMERGENCY", "UNPAID", "OTHER"] as const;

export function CreateLeaveButton({ employees, fixedEmployeeId }: { employees: EmployeeOption[]; fixedEmployeeId?: string }) {
  const { dict } = useI18n();
  return (
    <FormDialog trigger={<Button size="sm"><Plus size={16} /> {dict.leave.create}</Button>} title={dict.leave.create} onSubmit={createLeaveRequest}>
      {fixedEmployeeId ? (
        <input type="hidden" name="employeeId" value={fixedEmployeeId} />
      ) : (
        <Field label={dict.common.employee} htmlFor="employeeId" required>
          <Select id="employeeId" name="employeeId" required>
            <option value="">{dict.common.selectPlaceholder}</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.fullNameEn} ({e.employeeNumber})</option>)}
          </Select>
        </Field>
      )}
      <Field label={dict.leave.leaveType} htmlFor="leaveType" required>
        <Select id="leaveType" name="leaveType" required defaultValue="ANNUAL">
          {TYPES.map((t) => <option key={t} value={t}>{dict.statuses.leaveType[t]}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={dict.leave.startDate} htmlFor="startDate" required>
          <Input id="startDate" name="startDate" type="date" required defaultValue={toDateInputValue(new Date())} />
        </Field>
        <Field label={dict.leave.endDate} htmlFor="endDate" required>
          <Input id="endDate" name="endDate" type="date" required defaultValue={toDateInputValue(new Date())} />
        </Field>
      </div>
      <Field label={dict.common.reason} htmlFor="reason">
        <Input id="reason" name="reason" />
      </Field>
    </FormDialog>
  );
}

export function ApproveLeaveButton({ id }: { id: string }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-success hover:bg-success-soft" title={dict.leave.approve}><Check size={15} /></Button>}
      onConfirm={() => approveLeaveRequest(id)}
      title={dict.leave.approve}
      tone="primary"
    />
  );
}

export function RejectLeaveButton({ id }: { id: string }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft" title={dict.leave.reject}><X size={15} /></Button>}
      onConfirm={() => rejectLeaveRequest(id)}
      title={dict.leave.reject}
    />
  );
}

export function CancelLeaveButton({ id }: { id: string }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" title={dict.leave.cancel}><Ban size={15} /></Button>}
      onConfirm={() => cancelLeaveRequest(id)}
      title={dict.leave.cancel}
    />
  );
}
