"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { FormDialog } from "@/components/crud/form-dialog";
import { ConfirmAction } from "@/components/crud/confirm-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { createAttendanceEntry, deleteAttendanceEntry, updateAttendanceEntry } from "@/actions/attendance";
import { toDateInputValue, toTimeInputValue } from "@/lib/format";
import type { AttendanceEntry, AttendanceStatus } from "@/generated/prisma/client";
import type { EmployeeOption } from "@/lib/queries/employee-options";

const NO_CLOCK_STATUSES = new Set<AttendanceStatus>(["ABSENT", "LEAVE", "HOLIDAY", "DAY_OFF"]);

function Fields({ entry, employees, defaultEmployeeId, defaultDate }: { entry?: AttendanceEntry; employees: EmployeeOption[]; defaultEmployeeId?: string; defaultDate?: string }) {
  const { dict } = useI18n();
  const [status, setStatus] = useState<AttendanceStatus>(entry?.status ?? "PRESENT");
  const showClock = !NO_CLOCK_STATUSES.has(status);

  return (
    <>
      <Field label={dict.common.employee} htmlFor="employeeId" required>
        <Select id="employeeId" name="employeeId" required defaultValue={entry?.employeeId ?? defaultEmployeeId ?? ""}>
          <option value="">{dict.common.selectPlaceholder}</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.fullNameEn} ({e.employeeNumber})</option>
          ))}
        </Select>
      </Field>
      <Field label={dict.common.date} htmlFor="date" required>
        <Input id="date" name="date" type="date" required defaultValue={toDateInputValue(entry?.date) || defaultDate} />
      </Field>
      <Field label={dict.common.status} htmlFor="status" required>
        <Select id="status" name="status" required value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatus)}>
          {(["PRESENT", "LATE", "HALF_DAY", "ABSENT", "LEAVE", "HOLIDAY", "DAY_OFF"] as AttendanceStatus[]).map((s) => (
            <option key={s} value={s}>{dict.statuses.attendanceStatus[s]}</option>
          ))}
        </Select>
      </Field>
      {showClock && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label={dict.attendance.checkIn} htmlFor="checkIn" required>
              <Input id="checkIn" name="checkIn" type="time" required={showClock} defaultValue={toTimeInputValue(entry?.checkIn)} />
            </Field>
            <Field label={dict.attendance.checkOut} htmlFor="checkOut" hint={dict.attendance.checkOutHint}>
              <Input id="checkOut" name="checkOut" type="time" defaultValue={toTimeInputValue(entry?.checkOut)} />
            </Field>
          </div>
          <p className="-mt-2 text-xs text-muted">{dict.attendance.overnightHint}</p>
          <Field label={dict.attendance.breakMinutes} htmlFor="breakMinutes">
            <Input id="breakMinutes" name="breakMinutes" type="number" min="0" step="5" defaultValue={entry?.breakMinutes ?? 0} />
          </Field>
        </>
      )}
      <Field label={dict.common.notes} htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={entry?.notes ?? ""} />
      </Field>
    </>
  );
}

export function CreateAttendanceButton({ employees, defaultEmployeeId, defaultDate }: { employees: EmployeeOption[]; defaultEmployeeId?: string; defaultDate?: string }) {
  const { dict } = useI18n();
  return (
    <FormDialog
      trigger={<Button size="sm"><Plus size={16} /> {dict.attendance.create}</Button>}
      title={dict.attendance.create}
      onSubmit={createAttendanceEntry}
    >
      <Fields employees={employees} defaultEmployeeId={defaultEmployeeId} defaultDate={defaultDate} />
    </FormDialog>
  );
}

export function EditAttendanceButton({ entry, employees }: { entry: AttendanceEntry; employees: EmployeeOption[] }) {
  const { dict } = useI18n();
  return (
    <FormDialog
      trigger={<Button size="icon" variant="ghost" title={dict.common.edit}><Pencil size={15} /></Button>}
      title={dict.attendance.edit}
      onSubmit={updateAttendanceEntry.bind(null, entry.id)}
    >
      <Fields entry={entry} employees={employees} />
    </FormDialog>
  );
}

export function DeleteAttendanceButton({ id }: { id: string }) {
  return (
    <ConfirmAction
      trigger={<Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft"><Trash2 size={15} /></Button>}
      onConfirm={() => deleteAttendanceEntry(id)}
    />
  );
}
