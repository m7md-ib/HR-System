import "server-only";
import { db } from "@/lib/db";

export async function getEmployeeProfileData(employeeId: string) {
  const [attendance, payrollRecords, advances, deductions, bonuses, overtimeEntries, expenses, leaveRequests, ledgerEntries, documents] =
    await Promise.all([
      db.attendanceEntry.findMany({ where: { employeeId }, orderBy: { date: "desc" }, take: 30 }),
      db.payrollRecord.findMany({ where: { employeeId }, include: { payrollPeriod: true }, orderBy: { createdAt: "desc" } }),
      db.advance.findMany({ where: { employeeId }, orderBy: { date: "desc" } }),
      db.deduction.findMany({ where: { employeeId }, orderBy: { date: "desc" } }),
      db.bonus.findMany({ where: { employeeId }, orderBy: { date: "desc" } }),
      db.overtimeEntry.findMany({ where: { employeeId }, orderBy: { date: "desc" } }),
      db.employeeExpense.findMany({ where: { employeeId }, orderBy: { date: "desc" } }),
      db.leaveRequest.findMany({ where: { employeeId }, orderBy: { startDate: "desc" } }),
      db.employeeLedgerEntry.findMany({ where: { employeeId }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
      db.document.findMany({ where: { employeeId }, orderBy: { uploadedAt: "desc" } }),
    ]);

  return { attendance, payrollRecords, advances, deductions, bonuses, overtimeEntries, expenses, leaveRequests, ledgerEntries, documents };
}
