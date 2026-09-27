"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { FormDialog } from "@/components/crud/form-dialog";
import { ConfirmAction } from "@/components/crud/confirm-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { createDepartment, deleteDepartment, updateDepartment } from "@/actions/departments";
import type { Department } from "@/generated/prisma/client";

function Fields({ department }: { department?: Department }) {
  const { dict } = useI18n();
  return (
    <>
      <Field label={dict.departments.nameEn} htmlFor="name" required>
        <Input id="name" name="name" required defaultValue={department?.name} />
      </Field>
      <Field label={dict.departments.nameAr} htmlFor="nameAr">
        <Input id="nameAr" name="nameAr" dir="rtl" defaultValue={department?.nameAr ?? ""} />
      </Field>
      <Field label={dict.common.description} htmlFor="description">
        <Textarea id="description" name="description" defaultValue={department?.description ?? ""} />
      </Field>
    </>
  );
}

export function CreateDepartmentButton() {
  const { dict } = useI18n();
  return (
    <FormDialog
      trigger={
        <Button size="sm">
          <Plus size={16} /> {dict.departments.create}
        </Button>
      }
      title={dict.departments.create}
      onSubmit={createDepartment}
    >
      <Fields />
    </FormDialog>
  );
}

export function EditDepartmentButton({ department }: { department: Department }) {
  const { dict } = useI18n();
  return (
    <FormDialog
      trigger={
        <Button size="icon" variant="ghost" title={dict.common.edit}>
          <Pencil size={15} />
        </Button>
      }
      title={dict.departments.edit}
      onSubmit={updateDepartment.bind(null, department.id)}
    >
      <Fields department={department} />
    </FormDialog>
  );
}

export function DeleteDepartmentButton({ id }: { id: string }) {
  return (
    <ConfirmAction
      trigger={
        <Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft">
          <Trash2 size={15} />
        </Button>
      }
      onConfirm={() => deleteDepartment(id)}
    />
  );
}
