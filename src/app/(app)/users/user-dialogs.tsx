"use client";

import { Plus, Pencil, Ban, CheckCircle2 } from "lucide-react";
import { FormDialog } from "@/components/crud/form-dialog";
import { ConfirmAction } from "@/components/crud/confirm-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { createUser, toggleUserActive, updateUser } from "@/actions/users";
import type { Role } from "@/generated/prisma/client";
import type { EmployeeOption } from "@/lib/queries/employee-options";

const ROLES: Role[] = ["ADMIN", "HR_MANAGER", "HR_EMPLOYEE", "ACCOUNTANT", "MANAGER", "EMPLOYEE"];

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  employeeId: string | null;
  isActive: boolean;
}

export function CreateUserButton({ employees }: { employees: EmployeeOption[] }) {
  const { dict } = useI18n();
  return (
    <FormDialog trigger={<Button size="sm"><Plus size={16} /> {dict.users.create}</Button>} title={dict.users.create} onSubmit={createUser}>
      <Field label={dict.users.name} htmlFor="name" required>
        <Input id="name" name="name" required />
      </Field>
      <Field label={dict.common.email} htmlFor="email" required>
        <Input id="email" name="email" type="email" required />
      </Field>
      <Field label={dict.users.role} htmlFor="role" required>
        <Select id="role" name="role" required defaultValue="EMPLOYEE">
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
      </Field>
      <Field label={dict.users.linkedEmployee} htmlFor="employeeId">
        <Select id="employeeId" name="employeeId" defaultValue="">
          <option value="">{dict.common.selectPlaceholder}</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.fullNameEn} ({e.employeeNumber})</option>)}
        </Select>
      </Field>
      <Field label={dict.users.password} htmlFor="password" required>
        <Input id="password" name="password" type="password" minLength={8} required />
      </Field>
    </FormDialog>
  );
}

export function EditUserButton({ userRow, employees }: { userRow: UserRow; employees: EmployeeOption[] }) {
  const { dict } = useI18n();
  return (
    <FormDialog
      trigger={<Button size="icon" variant="ghost" title={dict.common.edit}><Pencil size={15} /></Button>}
      title={dict.users.edit}
      onSubmit={updateUser.bind(null, userRow.id)}
    >
      <Field label={dict.users.name} htmlFor="name" required>
        <Input id="name" name="name" required defaultValue={userRow.name} />
      </Field>
      <Field label={dict.users.role} htmlFor="role" required>
        <Select id="role" name="role" required defaultValue={userRow.role}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
      </Field>
      <Field label={dict.users.linkedEmployee} htmlFor="employeeId">
        <Select id="employeeId" name="employeeId" defaultValue={userRow.employeeId ?? ""}>
          <option value="">{dict.common.selectPlaceholder}</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.fullNameEn} ({e.employeeNumber})</option>)}
        </Select>
      </Field>
      <Field label={dict.users.newPassword} htmlFor="password">
        <Input id="password" name="password" type="password" minLength={8} />
      </Field>
    </FormDialog>
  );
}

export function ToggleUserActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const { dict } = useI18n();
  return (
    <ConfirmAction
      trigger={
        <Button size="icon" variant="ghost" className={isActive ? "text-danger hover:bg-danger-soft" : "text-success hover:bg-success-soft"} title={isActive ? dict.users.disable : dict.users.enable}>
          {isActive ? <Ban size={15} /> : <CheckCircle2 size={15} />}
        </Button>
      }
      onConfirm={() => toggleUserActive(id)}
      title={isActive ? dict.users.disable : dict.users.enable}
      tone={isActive ? "danger" : "primary"}
    />
  );
}
