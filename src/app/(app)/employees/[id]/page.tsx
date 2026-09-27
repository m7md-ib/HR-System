import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pencil, Mail, Phone, Landmark, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { getServerDictionary } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { getEmployeeFinancialSummary } from "@/lib/queries/employee-financials";
import { StatCard } from "@/components/ui/stat-card";
import { EmployeeProfileTabs } from "./profile-tabs";

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const isOwnProfile = user.employeeId === id;
  if (!isOwnProfile && !can(user.role, "employees", "view")) {
    redirect("/forbidden");
  }
  const { dict } = await getServerDictionary();

  const employee = await db.employee.findUnique({
    where: { id },
    include: { department: true, position: true },
  });
  if (!employee) notFound();

  const summary = await getEmployeeFinancialSummary(id);

  const rate =
    employee.employmentType === "FULL_TIME"
      ? employee.monthlySalary
      : employee.employmentType === "PART_TIME"
        ? employee.hourlyRate
        : employee.dailyPayBasis === "FIXED_DAILY"
          ? employee.dailyRate
          : employee.hourlyRate;

  return (
    <div>
      <PageHeader
        title={employee.fullNameEn}
        description={`${employee.employeeNumber} · ${employee.fullNameAr}`}
        actions={
          can(user.role, "employees", "edit") ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/employees/${id}/edit`}>
                <Pencil size={15} /> {dict.employees.editAction}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            {employee.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={employee.photoUrl} alt={employee.fullNameEn} className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft text-2xl font-bold text-primary-dark">
                {employee.fullNameEn.slice(0, 1)}
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">{employee.fullNameEn}</p>
              <p className="text-sm text-muted">{employee.position?.title ?? employee.jobTitle ?? "—"}</p>
            </div>
            <StatusBadge status={employee.status} label={dict.statuses.employeeStatus[employee.status]} />
            <div className="mt-2 flex w-full flex-col gap-2 border-t border-border pt-3 text-start text-sm">
              <div className="flex items-center gap-2 text-muted">
                <Phone size={14} /> {employee.phone ?? "—"}
              </div>
              <div className="flex items-center gap-2 text-muted">
                <Mail size={14} /> {employee.email ?? "—"}
              </div>
              <div className="flex items-center gap-2 text-muted">
                <Landmark size={14} /> {employee.department?.name ?? "—"}
              </div>
              {employee.emergencyContactName && (
                <div className="flex items-center gap-2 text-muted">
                  <ShieldAlert size={14} /> {employee.emergencyContactName} — {employee.emergencyContactPhone}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{dict.employees.sectionEmployment}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <InfoItem label={dict.common.type} value={dict.statuses.employmentType[employee.employmentType]} />
            <InfoItem label={dict.employees.hireDate} value={formatDate(employee.hireDate)} />
            <InfoItem label={dict.employees.contractEndDate} value={formatDate(employee.contractEndDate)} />
            <InfoItem label={dict.employees.payRate} value={formatMoney(rate)} />
            <InfoItem label={dict.employees.nationalId} value={employee.nationalId ?? "—"} />
            <InfoItem label={dict.employees.dateOfBirth} value={formatDate(employee.dateOfBirth)} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{dict.employees.financialSummary.title}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <StatCard label={dict.employees.financialSummary.totalEarnings} value={formatMoney(summary.totalEarnings)} />
          <StatCard label={dict.employees.financialSummary.totalAdvances} value={formatMoney(summary.totalAdvances)} tone="warning" />
          <StatCard label={dict.employees.financialSummary.totalDeductions} value={formatMoney(summary.totalDeductions)} tone="danger" />
          <StatCard label={dict.employees.financialSummary.totalReimbursements} value={formatMoney(summary.totalReimbursements)} />
          <StatCard label={dict.employees.financialSummary.netPayable} value={formatMoney(summary.netPayable)} tone="primary" />
          <StatCard label={dict.employees.financialSummary.paid} value={formatMoney(summary.paid)} tone="success" />
          <StatCard label={dict.employees.financialSummary.remaining} value={formatMoney(summary.remaining)} />
        </div>
      </div>

      <div className="mt-6">
        <EmployeeProfileTabs employeeId={id} />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
