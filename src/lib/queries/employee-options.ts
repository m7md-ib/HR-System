import "server-only";
import { db } from "@/lib/db";

/** Lightweight, plain-serializable employee shape for dropdowns in Client Components. */
export interface EmployeeOption {
  id: string;
  employeeNumber: string;
  fullNameEn: string;
  fullNameAr: string;
  employmentType: "DAILY" | "PART_TIME" | "FULL_TIME";
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
}

export async function getEmployeeOptions(params?: { activeOnly?: boolean }): Promise<EmployeeOption[]> {
  return db.employee.findMany({
    where: params?.activeOnly ? { status: "ACTIVE" } : undefined,
    select: {
      id: true,
      employeeNumber: true,
      fullNameEn: true,
      fullNameAr: true,
      employmentType: true,
      status: true,
    },
    orderBy: { fullNameEn: "asc" },
  });
}
