import "server-only";
import { db } from "@/lib/db";
import type { EmploymentType, Prisma } from "@/generated/prisma/client";

export interface PayrollSummaryFilters {
  from: Date;
  to: Date;
  departmentId?: string;
  employmentType?: string;
}

export async function getPayrollSummaryRecords(filters: PayrollSummaryFilters) {
  const where: Prisma.PayrollRecordWhereInput = {
    status: "ACTIVE",
    payrollPeriod: { startDate: { lte: filters.to }, endDate: { gte: filters.from } },
  };
  if (filters.departmentId) where.employee = { departmentId: filters.departmentId };
  if (filters.employmentType) where.employee = { ...(where.employee as object), employmentType: filters.employmentType as EmploymentType };

  return db.payrollRecord.findMany({ where, include: { employee: { include: { department: true } }, payrollPeriod: true } });
}
