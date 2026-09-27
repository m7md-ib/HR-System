import "server-only";
import { db } from "@/lib/db";

export async function generateEmployeeNumber(): Promise<string> {
  const last = await db.employee.findFirst({
    orderBy: { createdAt: "desc" },
    select: { employeeNumber: true },
  });
  const lastNum = last?.employeeNumber?.match(/(\d+)$/)?.[1];
  const next = lastNum ? Number(lastNum) + 1 : 1;
  return `EMP-${String(next).padStart(4, "0")}`;
}
