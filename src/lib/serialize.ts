import type { Employee } from "@/generated/prisma/client";

const DECIMAL_KEYS = ["basicSalary", "hourlyRate", "dailyRate", "weeklyRate", "monthlySalary"] as const;

export type SerializedEmployee = Omit<Employee, (typeof DECIMAL_KEYS)[number]> & Record<(typeof DECIMAL_KEYS)[number], string>;

/** Prisma's Decimal instances cannot cross the Server->Client component boundary as props. */
export function serializeEmployee(employee: Employee): SerializedEmployee {
  const patch = Object.fromEntries(DECIMAL_KEYS.map((key) => [key, employee[key].toString()])) as Record<
    (typeof DECIMAL_KEYS)[number],
    string
  >;
  return { ...employee, ...patch };
}
