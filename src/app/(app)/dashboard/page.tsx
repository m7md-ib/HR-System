import { Users, UserCheck, Clock, UserX, AlarmClock, Timer, CalendarClock, HandCoins, Receipt, Banknote } from "lucide-react";
import { requireUser } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { getDashboardData } from "@/lib/queries/dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DurationBadge } from "@/components/duration-badge";
import { formatMoney } from "@/lib/money";
import { AttendanceTrendChart } from "./attendance-trend-chart";
import { PayrollTrendChart } from "./payroll-trend-chart";
import { DepartmentPayrollChart } from "./department-payroll-chart";

export default async function DashboardPage() {
  const user = await requireUser();
  const { dict } = await getServerDictionary();
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{dict.dashboard.welcomeBack}, {user.name}</h1>
        <p className="text-sm text-muted">{dict.nav.dashboard}</p>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label={dict.dashboard.totalEmployees} value={data.totalEmployees} icon={<Users size={16} />} />
          <StatCard label={dict.dashboard.activeEmployees} value={data.activeEmployees} icon={<UserCheck size={16} />} tone="primary" />
          <StatCard label={dict.dashboard.presentToday} value={data.presentToday} icon={<UserCheck size={16} />} tone="success" />
          <StatCard label={dict.dashboard.absentToday} value={data.absentToday} icon={<UserX size={16} />} tone="danger" />
          <StatCard label={dict.dashboard.lateToday} value={data.lateToday} icon={<AlarmClock size={16} />} tone="warning" />
          <StatCard label={dict.dashboard.totalHoursToday} value={<DurationBadge minutes={data.totalMinutesToday} className="bg-white/20 text-white" />} icon={<Clock size={16} />} tone="accent" />
        </div>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label={dict.dashboard.pendingLeave} value={data.pendingLeave} icon={<CalendarClock size={16} />} />
          <StatCard label={dict.dashboard.pendingAdvances} value={data.outstandingAdvancesCount} icon={<HandCoins size={16} />} />
          <StatCard label={dict.dashboard.pendingExpenses} value={data.pendingExpenses} icon={<Receipt size={16} />} />
          <StatCard label={dict.dashboard.unpaidSalaries} value={data.unpaidSalaries} icon={<Banknote size={16} />} />
          <StatCard label={dict.dashboard.todayPayroll} value={formatMoney(data.todayPayroll)} icon={<Timer size={16} />} />
          <StatCard label={dict.dashboard.totalNetPayroll} value={formatMoney(data.totalNetPayroll)} tone="primary" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={dict.dashboard.weeklyPayroll} value={formatMoney(data.weeklyPayroll)} />
        <StatCard label={dict.dashboard.monthlyPayroll} value={formatMoney(data.monthlyPayroll)} />
        <StatCard label={dict.dashboard.outstandingAdvances} value={formatMoney(data.outstandingAdvances)} tone="warning" />
        <StatCard label={dict.dashboard.unpaidReimbursements} value={formatMoney(data.unpaidReimbursements)} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{dict.dashboard.attendanceTrend}</CardTitle></CardHeader>
          <CardContent><AttendanceTrendChart data={data.attendanceTrend} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{dict.dashboard.payrollTrend}</CardTitle></CardHeader>
          <CardContent><PayrollTrendChart data={data.payrollTrend} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{dict.dashboard.departmentPayroll}</CardTitle></CardHeader>
        <CardContent><DepartmentPayrollChart data={data.departmentPayroll} /></CardContent>
      </Card>
    </div>
  );
}
