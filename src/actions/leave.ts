"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission, requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";

const LEAVE_TYPES = ["ANNUAL", "SICK", "EMERGENCY", "UNPAID", "OTHER"] as const;

const schema = z.object({
  employeeId: z.string().min(1),
  leaveType: z.enum(LEAVE_TYPES),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function inclusiveDayCount(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export async function createLeaveRequest(formData: FormData) {
  const user = await requirePermission("leave", "create");
  const data = schema.parse({
    employeeId: formData.get("employeeId"),
    leaveType: formData.get("leaveType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason") || undefined,
    notes: formData.get("notes") || undefined,
  });

  const startDate = new Date(`${data.startDate}T00:00:00`);
  const endDate = new Date(`${data.endDate}T00:00:00`);
  if (endDate < startDate) {
    throw new Error("End date must be on or after the start date.");
  }

  const request = await db.leaveRequest.create({
    data: {
      employeeId: data.employeeId,
      leaveType: data.leaveType,
      startDate,
      endDate,
      numberOfDays: inclusiveDayCount(startDate, endDate),
      reason: data.reason,
      notes: data.notes,
    },
  });
  await logAudit({ userId: user.id, action: "CREATE", entityType: "LeaveRequest", entityId: request.id });
  revalidatePath("/leave");
  revalidatePath(`/employees/${data.employeeId}`);
}

export async function approveLeaveRequest(id: string) {
  const user = await requirePermission("leave", "approve");
  const request = await db.leaveRequest.update({
    where: { id },
    data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date() },
  });
  await logAudit({ userId: user.id, action: "APPROVE", entityType: "LeaveRequest", entityId: id });
  revalidatePath("/leave");
  revalidatePath(`/employees/${request.employeeId}`);
}

export async function rejectLeaveRequest(id: string) {
  const user = await requirePermission("leave", "approve");
  const request = await db.leaveRequest.update({
    where: { id },
    data: { status: "REJECTED", approvedById: user.id, approvedAt: new Date() },
  });
  await logAudit({ userId: user.id, action: "REJECT", entityType: "LeaveRequest", entityId: id });
  revalidatePath("/leave");
  revalidatePath(`/employees/${request.employeeId}`);
}

export async function cancelLeaveRequest(id: string) {
  const user = await requireUser();
  const request = await db.leaveRequest.findUniqueOrThrow({ where: { id } });
  const isOwner = user.employeeId === request.employeeId;
  const canManage = can(user.role, "leave", "edit");
  if (!isOwner && !canManage) {
    throw new Error("You are not allowed to cancel this leave request.");
  }
  if (request.status !== "PENDING") {
    throw new Error("Only pending requests can be cancelled.");
  }
  await db.leaveRequest.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "DELETE", entityType: "LeaveRequest", entityId: id });
  revalidatePath("/leave");
  revalidatePath(`/employees/${request.employeeId}`);
}
