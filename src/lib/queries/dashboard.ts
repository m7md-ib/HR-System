import "server-only";
import { db } from "@/lib/db";
import { roundMoney } from "@/lib/money";
import { sumDurations } from "@/lib/time/engine";
import { startOfMonth, startOfWeek, subDays, format } from "date-fns";

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getDashboardData() {
  const { start: todayStart, end: todayEnd } = todayRange();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 6 });
  const monthStart = startOfMonth(now);
  const fourteenDaysAgo = subDays(now, 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalEmployees,
    activeEmployees,
    todayAttendance,
    pendingLeave,
    outstandingAdvancesCount,
    pendingExpenses,
    unpaidSalaries,
    todayPayrollAgg,
    weeklyPayrollAgg,
    monthlyPayrollAgg,
    outstandingAdvanceAgg,
    unpaidReimbursementAgg,
    totalNetPayrollAgg,
    attendanceLast14Days,
    payrollRecordsForTrend,
    departmentPayrollRows,
  ] = await Promise.all([
    db.employee.count(),
    db.employee.count({ where: { status: "ACTIVE" } }),
    db.attendanceEntry.findMany({ where: { date: { gte: todayStart, lte: todayEnd } } }),
    db.leaveRequest.count({ where: { status: "PENDING" } }),
    db.advance.count({ where: { status: { in: ["ACTIVE", "PARTIALLY_SETTLED"] } } }),
    db.employeeExpense.count({ where: { approvalStatus: "PENDING" } }),
    db.payrollRecord.count({ where: { remainingAmount: { gt: 0 }, status: "ACTIVE" } }),
    db.payrollRecord.aggregate({
      where: { status: "ACTIVE", payrollPeriod: { periodType: "DAILY", startDate: { lte: todayEnd }, endDate: { gte: todayStart } } },
      _sum: { netPayable: true },
    }),
    db.payrollRecord.aggregate({
      where: { status: "ACTIVE", payrollPeriod: { periodType: "WEEKLY", startDate: { lte: now }, endDate: { gte: weekStart } } },
      _sum: { netPayable: true },
    }),
    db.payrollRecord.aggregate({
      where: { status: "ACTIVE", payrollPeriod: { periodType: "MONTHLY", startDate: { lte: now }, endDate: { gte: monthStart } } },
      _sum: { netPayable: true },
    }),
    db.advance.aggregate({ where: { status: { in: ["ACTIVE", "PARTIALLY_SETTLED"] } }, _sum: { remainingBalance: true } }),
    db.employeeExpense.aggregate({ where: { approvalStatus: "APPROVED", paymentStatus: "UNPAID" }, _sum: { amount: true } }),
    db.payrollRecord.aggregate({ where: { status: "ACTIVE" }, _sum: { netPayable: true } }),
    db.attendanceEntry.findMany({ where: { date: { gte: fourteenDaysAgo, lte: todayEnd } }, select: { date: true, status: true } }),
    db.payrollRecord.findMany({
      where: { status: "ACTIVE", payrollPeriod: { startDate: { gte: subDays(now, 183) } } },
      select: { netPayable: true, payrollPeriod: { select: { startDate: true } } },
    }),
    db.payrollRecord.findMany({
      where: { status: "ACTIVE" },
      select: { netPayable: true, employee: { select: { department: { select: { name: true } } } } },
    }),
  ]);

  const presentToday = new Set(todayAttendance.filter((a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "HALF_DAY").map((a) => a.employeeId)).size;
  const absentToday = new Set(todayAttendance.filter((a) => a.status === "ABSENT").map((a) => a.employeeId)).size;
  const lateToday = new Set(todayAttendance.filter((a) => a.status === "LATE").map((a) => a.employeeId)).size;
  const totalMinutesToday = sumDurations(...todayAttendance.map((a) => a.workedMinutes));

  const attendanceByDay = new Map<string, { present: number; absent: number; late: number }>();
  for (let i = 0; i < 14; i++) {
    const d = subDays(now, 13 - i);
    attendanceByDay.set(format(d, "yyyy-MM-dd"), { present: 0, absent: 0, late: 0 });
  }
  for (const entry of attendanceLast14Days) {
    const key = format(entry.date, "yyyy-MM-dd");
    const bucket = attendanceByDay.get(key);
    if (!bucket) continue;
    if (entry.status === "PRESENT" || entry.status === "HALF_DAY") bucket.present += 1;
    else if (entry.status === "LATE") bucket.late += 1;
    else if (entry.status === "ABSENT") bucket.absent += 1;
  }
  const attendanceTrend = Array.from(attendanceByDay.entries()).map(([date, v]) => ({
    date: format(new Date(date), "MM/dd"),
    present: v.present,
    late: v.late,
    absent: v.absent,
  }));

  const payrollByMonth = new Map<string, number>();
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = format(d, "yyyy-MM");
    monthKeys.push(key);
    payrollByMonth.set(key, 0);
  }
  for (const record of payrollRecordsForTrend) {
    const key = format(record.payrollPeriod.startDate, "yyyy-MM");
    if (payrollByMonth.has(key)) {
      payrollByMonth.set(key, payrollByMonth.get(key)! + Number(record.netPayable));
    }
  }
  const payrollTrend = monthKeys.map((key) => ({ month: format(new Date(`${key}-01`), "MMM yyyy"), total: roundMoney(payrollByMonth.get(key) ?? 0).toNumber() }));

  const departmentPayrollMap = new Map<string, number>();
  for (const row of departmentPayrollRows) {
    const name = row.employee.department?.name ?? "Unassigned";
    departmentPayrollMap.set(name, (departmentPayrollMap.get(name) ?? 0) + Number(row.netPayable));
  }
  const departmentPayroll = Array.from(departmentPayrollMap.entries())
    .map(([name, total]) => ({ name, total: roundMoney(total).toNumber() }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return {
    totalEmployees,
    activeEmployees,
    presentToday,
    absentToday,
    lateToday,
    totalMinutesToday,
    pendingLeave,
    outstandingAdvancesCount,
    pendingExpenses,
    unpaidSalaries,
    todayPayroll: roundMoney(todayPayrollAgg._sum.netPayable?.toString() ?? 0).toFixed(2),
    weeklyPayroll: roundMoney(weeklyPayrollAgg._sum.netPayable?.toString() ?? 0).toFixed(2),
    monthlyPayroll: roundMoney(monthlyPayrollAgg._sum.netPayable?.toString() ?? 0).toFixed(2),
    outstandingAdvances: roundMoney(outstandingAdvanceAgg._sum.remainingBalance?.toString() ?? 0).toFixed(2),
    unpaidReimbursements: roundMoney(unpaidReimbursementAgg._sum.amount?.toString() ?? 0).toFixed(2),
    totalNetPayroll: roundMoney(totalNetPayrollAgg._sum.netPayable?.toString() ?? 0).toFixed(2),
    attendanceTrend,
    payrollTrend,
    departmentPayroll,
  };
}
