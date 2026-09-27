import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { generateEmployeeNumber } from "@/lib/queries/employee-number";
import { PageHeader } from "@/components/page-header";
import { createEmployee } from "@/actions/employees";
import { EmployeeForm } from "../employee-form";

export default async function NewEmployeePage() {
  await requirePermission("employees", "create");
  const { dict } = await getServerDictionary();

  const [departments, positions, suggestedEmployeeNumber] = await Promise.all([
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.position.findMany({ orderBy: { title: "asc" } }),
    generateEmployeeNumber(),
  ]);

  return (
    <div>
      <PageHeader title={dict.employees.create} />
      <EmployeeForm action={createEmployee} departments={departments} positions={positions} suggestedEmployeeNumber={suggestedEmployeeNumber} />
    </div>
  );
}
