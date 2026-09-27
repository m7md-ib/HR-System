"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { FormDialog } from "@/components/crud/form-dialog";
import { ConfirmAction } from "@/components/crud/confirm-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { createPosition, deletePosition, updatePosition } from "@/actions/positions";
import type { Department, Position } from "@/generated/prisma/client";

function Fields({ position, departments }: { position?: Position; departments: Department[] }) {
  const { dict } = useI18n();
  return (
    <>
      <Field label={dict.positions.titleEn} htmlFor="title" required>
        <Input id="title" name="title" required defaultValue={position?.title} />
      </Field>
      <Field label={dict.positions.titleAr} htmlFor="titleAr">
        <Input id="titleAr" name="titleAr" dir="rtl" defaultValue={position?.titleAr ?? ""} />
      </Field>
      <Field label={dict.common.department} htmlFor="departmentId">
        <Select id="departmentId" name="departmentId" defaultValue={position?.departmentId ?? ""}>
          <option value="">{dict.common.selectPlaceholder}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={dict.common.description} htmlFor="description">
        <Textarea id="description" name="description" defaultValue={position?.description ?? ""} />
      </Field>
    </>
  );
}

export function CreatePositionButton({ departments }: { departments: Department[] }) {
  const { dict } = useI18n();
  return (
    <FormDialog
      trigger={
        <Button size="sm">
          <Plus size={16} /> {dict.positions.create}
        </Button>
      }
      title={dict.positions.create}
      onSubmit={createPosition}
    >
      <Fields departments={departments} />
    </FormDialog>
  );
}

export function EditPositionButton({ position, departments }: { position: Position; departments: Department[] }) {
  const { dict } = useI18n();
  return (
    <FormDialog
      trigger={
        <Button size="icon" variant="ghost" title={dict.common.edit}>
          <Pencil size={15} />
        </Button>
      }
      title={dict.positions.edit}
      onSubmit={updatePosition.bind(null, position.id)}
    >
      <Fields position={position} departments={departments} />
    </FormDialog>
  );
}

export function DeletePositionButton({ id }: { id: string }) {
  return (
    <ConfirmAction
      trigger={
        <Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft">
          <Trash2 size={15} />
        </Button>
      }
      onConfirm={() => deletePosition(id)}
    />
  );
}
