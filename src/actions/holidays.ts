"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(1),
  nameAr: z.string().trim().optional(),
  date: z.string().min(1),
  type: z.string().trim().optional(),
  isPaid: z.string().optional(),
  notes: z.string().trim().optional(),
});

function readForm(formData: FormData) {
  return schema.parse({
    name: formData.get("name"),
    nameAr: formData.get("nameAr") || undefined,
    date: formData.get("date"),
    type: formData.get("type") || undefined,
    isPaid: formData.get("isPaid") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createHoliday(formData: FormData) {
  const user = await requirePermission("holidays", "create");
  const data = readForm(formData);
  const holiday = await db.holiday.create({
    data: {
      name: data.name,
      nameAr: data.nameAr,
      date: new Date(`${data.date}T00:00:00`),
      type: data.type,
      isPaid: data.isPaid === "on",
      notes: data.notes,
    },
  });
  await logAudit({ userId: user.id, action: "CREATE", entityType: "Holiday", entityId: holiday.id });
  revalidatePath("/holidays");
}

export async function updateHoliday(id: string, formData: FormData) {
  const user = await requirePermission("holidays", "edit");
  const data = readForm(formData);
  await db.holiday.update({
    where: { id },
    data: {
      name: data.name,
      nameAr: data.nameAr,
      date: new Date(`${data.date}T00:00:00`),
      type: data.type,
      isPaid: data.isPaid === "on",
      notes: data.notes,
    },
  });
  await logAudit({ userId: user.id, action: "UPDATE", entityType: "Holiday", entityId: id });
  revalidatePath("/holidays");
}

export async function deleteHoliday(id: string) {
  const user = await requirePermission("holidays", "delete");
  await db.holiday.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "DELETE", entityType: "Holiday", entityId: id });
  revalidatePath("/holidays");
}
