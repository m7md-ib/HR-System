import Link from "next/link";
import {
  CalendarDays, Clock, FileBarChart, HandCoins, MinusCircle, Timer, Gift, Receipt,
  Wallet, BookText, PieChart, Building2, UserX, CalendarOff,
} from "lucide-react";
import { requirePermission } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export default async function ReportsCenterPage() {
  await requirePermission("reports", "view");
  const { dict } = await getServerDictionary();

  const groups: { title: string; items: { label: string; href: string; icon: typeof FileBarChart }[] }[] = [
    {
      title: dict.employees.tabs.attendance,
      items: [
        { label: dict.reports.dailyAttendance, href: "/attendance", icon: CalendarDays },
        { label: dict.reports.workingHours, href: "/working-hours", icon: Clock },
        { label: dict.reports.absence, href: "/reports/absence", icon: UserX },
        { label: dict.reports.leave, href: "/leave", icon: CalendarOff },
      ],
    },
    {
      title: dict.nav.payroll,
      items: [
        { label: dict.reports.payrollSummary, href: "/reports/payroll-summary", icon: PieChart },
        { label: dict.reports.departmentPayroll, href: "/reports/department-payroll", icon: Building2 },
        { label: dict.reports.salaryPayments, href: "/payments", icon: Wallet },
      ],
    },
    {
      title: dict.nav.advances,
      items: [
        { label: dict.reports.advances, href: "/advances", icon: HandCoins },
        { label: dict.reports.advanceBalance, href: "/reports/advance-balance", icon: HandCoins },
        { label: dict.reports.deductions, href: "/deductions", icon: MinusCircle },
        { label: dict.reports.overtime, href: "/overtime", icon: Timer },
        { label: dict.reports.bonuses, href: "/bonuses", icon: Gift },
      ],
    },
    {
      title: dict.nav.expenses,
      items: [
        { label: dict.reports.employeeExpenses, href: "/expenses", icon: Receipt },
        { label: dict.reports.employeeLedger, href: "/reports/employee-ledger", icon: BookText },
      ],
    },
  ];

  return (
    <div>
      <PageHeader title={dict.reports.title} description={dict.reports.subtitle} />
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="mb-3 text-sm font-semibold text-foreground">{group.title}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {group.items.map((item) => (
                <Link key={item.href + item.label} href={item.href}>
                  <Card className="flex h-full items-center gap-3 p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/30">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary-dark">
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
