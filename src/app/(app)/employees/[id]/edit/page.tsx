import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { updateEmployee } from "@/actions/employees";
import { serializeEmployee } from "@/lib/serialize";
import { EmployeeForm } from "../../employee-form";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("employees", "edit");
  const { dict } = await getServerDictionary();
  const { id } = await params;

  const [employee, departments, positions] = await Promise.all([
    db.employee.findUnique({ where: { id } }),
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.position.findMany({ orderBy: { title: "asc" } }),
  ]);

  if (!employee) notFound();

  return (
    <div>
      <PageHeader title={dict.employees.edit} description={employee.fullNameEn} />
      <EmployeeForm action={updateEmployee.bind(null, id)} employee={serializeEmployee(employee)} departments={departments} positions={positions} />
    </div>
  );
}
