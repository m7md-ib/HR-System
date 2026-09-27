"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { toPrismaDecimal } from "@/lib/money";
import { saveUploadedFile, isUploadableFile } from "@/lib/upload";

const moneyField = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v : "0"))
  .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Must be a non-negative number");

const dateField = z
  .string()
  .min(1, "Required")
  .transform((v) => new Date(v));

const optionalDateField = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? new Date(v) : null));

const optionalText = z.string().trim().optional().transform((v) => (v ? v : undefined));

const employeeSchema = z.object({
  employeeNumber: z.string().trim().min(1),
  fullNameAr: z.string().trim().min(1),
  fullNameEn: z.string().trim().min(1),
  phone: optionalText,
  email: optionalText,
  nationalId: optionalText,
  dateOfBirth: optionalDateField,
  address: optionalText,
  departmentId: optionalText,
  positionId: optionalText,
  jobTitle: optionalText,
  employmentType: z.enum(["DAILY", "PART_TIME", "FULL_TIME"]),
  hireDate: dateField,
  contractStartDate: optionalDateField,
  contractEndDate: optionalDateField,
  dailyPayBasis: z.enum(["HOURLY", "FIXED_DAILY"]),
  basicSalary: moneyField,
  hourlyRate: moneyField,
  dailyRate: moneyField,
  weeklyRate: moneyField,
  monthlySalary: moneyField,
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]),
  bankName: optionalText,
  bankAccountNumber: optionalText,
  bankIban: optionalText,
  emergencyContactName: optionalText,
  emergencyContactPhone: optionalText,
  notes: optionalText,
});

const FIELD_KEYS = [
  "employeeNumber", "fullNameAr", "fullNameEn", "phone", "email", "nationalId", "dateOfBirth", "address",
  "departmentId", "positionId", "jobTitle", "employmentType", "hireDate", "contractStartDate", "contractEndDate",
  "dailyPayBasis", "basicSalary", "hourlyRate", "dailyRate", "weeklyRate", "monthlySalary", "status",
  "bankName", "bankAccountNumber", "bankIban", "emergencyContactName", "emergencyContactPhone", "notes",
] as const;

function readEmployeeForm(formData: FormData) {
  const raw: Record<string, string | undefined> = {};
  for (const key of FIELD_KEYS) {
    raw[key] = formData.get(key)?.toString() ?? undefined;
  }
  const parsed = employeeSchema.parse(raw);
  return {
    ...parsed,
    departmentId: parsed.departmentId ?? null,
    positionId: parsed.positionId ?? null,
    basicSalary: toPrismaDecimal(parsed.basicSalary),
    hourlyRate: toPrismaDecimal(parsed.hourlyRate),
    dailyRate: toPrismaDecimal(parsed.dailyRate),
    weeklyRate: toPrismaDecimal(parsed.weeklyRate),
    monthlySalary: toPrismaDecimal(parsed.monthlySalary),
  };
}

async function assertUniqueEmployeeNumber(employeeNumber: string, excludeId?: string) {
  const existing = await db.employee.findUnique({ where: { employeeNumber } });
  if (existing && existing.id !== excludeId) {
    throw new Error("This employee number is already in use.");
  }
}

export async function createEmployee(formData: FormData) {
  const user = await requirePermission("employees", "create");
  const data = readEmployeeForm(formData);
  await assertUniqueEmployeeNumber(data.employeeNumber);

  let photoUrl: string | undefined;
  const photo = formData.get("photo");
  if (isUploadableFile(photo)) {
    photoUrl = await saveUploadedFile(photo, "employees");
  }

  const employee = await db.employee.create({ data: { ...data, photoUrl } });
  await logAudit({
    userId: user.id,
    action: "CREATE",
    entityType: "Employee",
    entityId: employee.id,
    newValue: { fullNameEn: data.fullNameEn, employeeNumber: data.employeeNumber },
  });
  revalidatePath("/employees");
  redirect(`/employees/${employee.id}`);
}

export async function updateEmployee(id: string, formData: FormData) {
  const user = await requirePermission("employees", "edit");
  const data = readEmployeeForm(formData);
  const before = await db.employee.findUniqueOrThrow({ where: { id } });
  await assertUniqueEmployeeNumber(data.employeeNumber, id);

  let photoUrl: string | undefined;
  const photo = formData.get("photo");
  if (isUploadableFile(photo)) {
    photoUrl = await saveUploadedFile(photo, "employees");
  }

  await db.employee.update({ where: { id }, data: { ...data, ...(photoUrl ? { photoUrl } : {}) } });
  await logAudit({
    userId: user.id,
    action: "UPDATE",
    entityType: "Employee",
    entityId: id,
    oldValue: { status: before.status, employmentType: before.employmentType },
    newValue: { status: data.status, employmentType: data.employmentType },
  });
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}`);
}

export async function deleteEmployee(id: string) {
  const user = await requirePermission("employees", "delete");
  const [attendance, payroll, advances] = await Promise.all([
    db.attendanceEntry.count({ where: { employeeId: id } }),
    db.payrollRecord.count({ where: { employeeId: id } }),
    db.advance.count({ where: { employeeId: id } }),
  ]);
  if (attendance + payroll + advances > 0) {
    throw new Error("This employee has existing records and cannot be deleted. Set their status to Terminated instead.");
  }
  await db.employee.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "DELETE", entityType: "Employee", entityId: id });
  revalidatePath("/employees");
}
