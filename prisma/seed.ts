import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { combineShiftTimestamps, calculateDuration } from "../src/lib/time/engine";
import { toPrismaDecimal } from "../src/lib/money";
import { appendLedgerEntry } from "../src/lib/ledger";
import { generatePayrollPeriod } from "../src/lib/payroll/generate";
import type { AttendanceStatus, DailyPayBasis, EmploymentType } from "../src/generated/prisma/client";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isFriday(d: Date): boolean {
  return d.getDay() === 5;
}

async function hash(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

interface EmployeeSeed {
  employeeNumber: string;
  fullNameEn: string;
  fullNameAr: string;
  phone: string;
  email: string;
  departmentKey: string;
  positionKey: string;
  employmentType: EmploymentType;
  dailyPayBasis: DailyPayBasis;
  hourlyRate: string;
  dailyRate: string;
  weeklyRate: string;
  monthlySalary: string;
  basicSalary: string;
  hireDate: Date;
}

async function resetTransactionalData() {
  await db.$transaction([
    db.notification.deleteMany({}),
    db.auditLog.deleteMany({}),
    db.employeeLedgerEntry.deleteMany({}),
    db.payment.deleteMany({}),
    db.payrollItem.deleteMany({}),
    db.advanceTransaction.deleteMany({}),
    db.payrollRecord.deleteMany({}),
    db.payrollPeriod.deleteMany({}),
    db.advance.deleteMany({}),
    db.deduction.deleteMany({}),
    db.bonus.deleteMany({}),
    db.allowance.deleteMany({}),
    db.overtimeEntry.deleteMany({}),
    db.employeeExpense.deleteMany({}),
    db.leaveRequest.deleteMany({}),
    db.attendanceEntry.deleteMany({}),
    db.document.deleteMany({}),
    db.session.deleteMany({}),
    db.user.deleteMany({}),
    db.employee.deleteMany({}),
    db.holiday.deleteMany({}),
    db.position.deleteMany({}),
    db.department.deleteMany({}),
  ]);
}

async function seedOrgStructure() {
  const departmentNames: { key: string; name: string; nameAr: string }[] = [
    { key: "management", name: "Management", nameAr: "الإدارة" },
    { key: "reception", name: "Reception", nameAr: "الاستقبال" },
    { key: "housekeeping", name: "Housekeeping", nameAr: "التدبير المنزلي" },
    { key: "kitchen", name: "Kitchen", nameAr: "المطبخ" },
    { key: "restaurant", name: "Restaurant", nameAr: "المطعم" },
    { key: "accounting", name: "Accounting", nameAr: "المحاسبة" },
    { key: "hr", name: "HR", nameAr: "الموارد البشرية" },
    { key: "maintenance", name: "Maintenance", nameAr: "الصيانة" },
    { key: "security", name: "Security", nameAr: "الأمن" },
  ];

  const departments: Record<string, string> = {};
  for (const d of departmentNames) {
    const dept = await db.department.create({ data: { name: d.name, nameAr: d.nameAr } });
    departments[d.key] = dept.id;
  }

  const positionDefs: { key: string; title: string; titleAr: string; deptKey: string }[] = [
    { key: "manager", title: "Manager", titleAr: "مدير", deptKey: "management" },
    { key: "receptionist", title: "Receptionist", titleAr: "موظف استقبال", deptKey: "reception" },
    { key: "accountant", title: "Accountant", titleAr: "محاسب", deptKey: "accounting" },
    { key: "waiter", title: "Waiter", titleAr: "نادل", deptKey: "restaurant" },
    { key: "chef", title: "Chef", titleAr: "طاهٍ", deptKey: "kitchen" },
    { key: "housekeeper", title: "Housekeeper", titleAr: "عامل تدبير منزلي", deptKey: "housekeeping" },
    { key: "driver", title: "Driver", titleAr: "سائق", deptKey: "maintenance" },
    { key: "security", title: "Security Guard", titleAr: "حارس أمن", deptKey: "security" },
    { key: "hrofficer", title: "HR Officer", titleAr: "موظف موارد بشرية", deptKey: "hr" },
  ];

  const positions: Record<string, string> = {};
  for (const p of positionDefs) {
    const pos = await db.position.create({ data: { title: p.title, titleAr: p.titleAr, departmentId: departments[p.deptKey] } });
    positions[p.key] = pos.id;
  }

  await db.holiday.createMany({
    data: [
      { name: "Independence Day", nameAr: "عيد الاستقلال", date: new Date(new Date().getFullYear(), 4, 25), type: "National", isPaid: true },
      { name: "Labour Day", nameAr: "عيد العمال", date: new Date(new Date().getFullYear(), 4, 1), type: "National", isPaid: true },
      { name: "New Year's Day", nameAr: "رأس السنة الميلادية", date: new Date(new Date().getFullYear(), 0, 1), type: "National", isPaid: true },
    ],
  });

  return { departments, positions };
}

async function seedEmployees(departments: Record<string, string>, positions: Record<string, string>) {
  const defs: EmployeeSeed[] = [
    { employeeNumber: "EMP-0001", fullNameEn: "Ahmad Al-Rashid", fullNameAr: "أحمد الراشد", phone: "0790001001", email: "ahmad.rashid@mayshr.com", departmentKey: "management", positionKey: "manager", employmentType: "FULL_TIME", dailyPayBasis: "HOURLY", hourlyRate: "0", dailyRate: "0", weeklyRate: "0", monthlySalary: "950.00", basicSalary: "950.00", hireDate: daysAgo(900) },
    { employeeNumber: "EMP-0002", fullNameEn: "Layla Hijazi", fullNameAr: "ليلى حجازي", phone: "0790001002", email: "layla.hijazi@mayshr.com", departmentKey: "accounting", positionKey: "accountant", employmentType: "FULL_TIME", dailyPayBasis: "HOURLY", hourlyRate: "0", dailyRate: "0", weeklyRate: "0", monthlySalary: "700.00", basicSalary: "700.00", hireDate: daysAgo(700) },
    { employeeNumber: "EMP-0003", fullNameEn: "Yousef Saleh", fullNameAr: "يوسف صالح", phone: "0790001003", email: "yousef.saleh@mayshr.com", departmentKey: "hr", positionKey: "hrofficer", employmentType: "FULL_TIME", dailyPayBasis: "HOURLY", hourlyRate: "0", dailyRate: "0", weeklyRate: "0", monthlySalary: "650.00", basicSalary: "650.00", hireDate: daysAgo(500) },
    { employeeNumber: "EMP-0004", fullNameEn: "Rania Nasser", fullNameAr: "رانيا ناصر", phone: "0790001004", email: "rania.nasser@mayshr.com", departmentKey: "reception", positionKey: "manager", employmentType: "FULL_TIME", dailyPayBasis: "HOURLY", hourlyRate: "0", dailyRate: "0", weeklyRate: "0", monthlySalary: "800.00", basicSalary: "800.00", hireDate: daysAgo(620) },

    { employeeNumber: "EMP-0005", fullNameEn: "Sami Odeh", fullNameAr: "سامي عودة", phone: "0790001005", email: "sami.odeh@mayshr.com", departmentKey: "restaurant", positionKey: "waiter", employmentType: "PART_TIME", dailyPayBasis: "HOURLY", hourlyRate: "2.50", dailyRate: "0", weeklyRate: "0", monthlySalary: "0", basicSalary: "0", hireDate: daysAgo(300) },
    { employeeNumber: "EMP-0006", fullNameEn: "Dana Khalil", fullNameAr: "دانا خليل", phone: "0790001006", email: "dana.khalil@mayshr.com", departmentKey: "reception", positionKey: "receptionist", employmentType: "PART_TIME", dailyPayBasis: "HOURLY", hourlyRate: "3.00", dailyRate: "0", weeklyRate: "0", monthlySalary: "0", basicSalary: "0", hireDate: daysAgo(250) },
    { employeeNumber: "EMP-0007", fullNameEn: "Nour Aziz", fullNameAr: "نور عزيز", phone: "0790001007", email: "nour.aziz@mayshr.com", departmentKey: "housekeeping", positionKey: "housekeeper", employmentType: "PART_TIME", dailyPayBasis: "HOURLY", hourlyRate: "2.20", dailyRate: "0", weeklyRate: "0", monthlySalary: "0", basicSalary: "0", hireDate: daysAgo(180) },

    { employeeNumber: "EMP-0008", fullNameEn: "Mohammad Yousef", fullNameAr: "محمد يوسف", phone: "0790001008", email: "mohammad.yousef@mayshr.com", departmentKey: "kitchen", positionKey: "chef", employmentType: "DAILY", dailyPayBasis: "HOURLY", hourlyRate: "3.00", dailyRate: "20.00", weeklyRate: "0", monthlySalary: "0", basicSalary: "0", hireDate: daysAgo(120) },
    { employeeNumber: "EMP-0009", fullNameEn: "Khalid Saeed", fullNameAr: "خالد سعيد", phone: "0790001009", email: "khalid.saeed@mayshr.com", departmentKey: "security", positionKey: "security", employmentType: "DAILY", dailyPayBasis: "FIXED_DAILY", hourlyRate: "2.50", dailyRate: "22.00", weeklyRate: "0", monthlySalary: "0", basicSalary: "0", hireDate: daysAgo(200) },
    { employeeNumber: "EMP-0010", fullNameEn: "Fadi Barakat", fullNameAr: "فادي بركات", phone: "0790001010", email: "fadi.barakat@mayshr.com", departmentKey: "maintenance", positionKey: "driver", employmentType: "DAILY", dailyPayBasis: "HOURLY", hourlyRate: "2.80", dailyRate: "0", weeklyRate: "0", monthlySalary: "0", basicSalary: "0", hireDate: daysAgo(150) },
    { employeeNumber: "EMP-0011", fullNameEn: "Huda Mansour", fullNameAr: "هدى منصور", phone: "0790001011", email: "huda.mansour@mayshr.com", departmentKey: "housekeeping", positionKey: "housekeeper", employmentType: "DAILY", dailyPayBasis: "HOURLY", hourlyRate: "2.50", dailyRate: "0", weeklyRate: "0", monthlySalary: "0", basicSalary: "0", hireDate: daysAgo(90) },
    { employeeNumber: "EMP-0012", fullNameEn: "Omar Zaid", fullNameAr: "عمر زايد", phone: "0790001012", email: "omar.zaid@mayshr.com", departmentKey: "maintenance", positionKey: "driver", employmentType: "DAILY", dailyPayBasis: "FIXED_DAILY", hourlyRate: "2.60", dailyRate: "18.00", weeklyRate: "0", monthlySalary: "0", basicSalary: "0", hireDate: daysAgo(60) },
  ];

  const employees: Record<string, string> = {};
  for (const e of defs) {
    const created = await db.employee.create({
      data: {
        employeeNumber: e.employeeNumber,
        fullNameEn: e.fullNameEn,
        fullNameAr: e.fullNameAr,
        phone: e.phone,
        email: e.email,
        nationalId: `99${Math.floor(1000000 + Math.random() * 8999999)}`,
        address: "Amman, Jordan",
        departmentId: departments[e.departmentKey],
        positionId: positions[e.positionKey],
        employmentType: e.employmentType,
        hireDate: e.hireDate,
        dailyPayBasis: e.dailyPayBasis,
        hourlyRate: toPrismaDecimal(e.hourlyRate),
        dailyRate: toPrismaDecimal(e.dailyRate),
        weeklyRate: toPrismaDecimal(e.weeklyRate),
        monthlySalary: toPrismaDecimal(e.monthlySalary),
        basicSalary: toPrismaDecimal(e.basicSalary),
        status: "ACTIVE",
        bankName: "Housing Bank",
        bankAccountNumber: `JO${Math.floor(10000000 + Math.random() * 89999999)}`,
        emergencyContactName: "Family Contact",
        emergencyContactPhone: "0790009999",
      },
    });
    employees[e.employeeNumber] = created.id;
  }

  return employees;
}

async function createShift(employeeId: string, date: Date, checkIn: string, checkOut: string, breakMinutes: number, status: AttendanceStatus) {
  const { checkIn: ci, checkOut: co } = combineShiftTimestamps(dateKey(date), checkIn, checkOut);
  const workedMinutes = co ? calculateDuration(ci, co, breakMinutes) : 0;
  await db.attendanceEntry.create({
    data: { employeeId, date, checkIn: ci, checkOut: co, breakMinutes, workedMinutes, status },
  });
}

async function createDayOff(employeeId: string, date: Date, status: AttendanceStatus) {
  await db.attendanceEntry.create({ data: { employeeId, date, workedMinutes: 0, status } });
}

async function seedAttendance(employees: Record<string, string>) {
  const allIds = Object.values(employees);

  for (let i = 34; i >= 0; i--) {
    const date = daysAgo(i);
    const friday = isFriday(date);

    for (const employeeId of allIds) {
      if (friday) {
        await createDayOff(employeeId, date, "DAY_OFF");
        continue;
      }
      const roll = Math.random();
      if (roll < 0.05) {
        await createDayOff(employeeId, date, "ABSENT");
      } else if (roll < 0.12) {
        await createShift(employeeId, date, "08:20", "16:10", 30, "LATE");
      } else {
        await createShift(employeeId, date, "08:00", "16:30", 30, "PRESENT");
      }
    }
  }

  // Documented example from the spec: Mohammad's exact two shifts (06:30 + 02:20 = 08:50)
  const mohammadId = employees["EMP-0008"];
  await db.attendanceEntry.deleteMany({ where: { employeeId: mohammadId, date: { in: [daysAgo(5), daysAgo(4)] } } });
  await createShift(mohammadId, daysAgo(5), "08:00", "14:30", 0, "PRESENT");
  await createShift(mohammadId, daysAgo(4), "10:00", "12:20", 0, "PRESENT");

  // Overnight shift example for the night security guard (22:00 -> 02:00 = 4h)
  const khalidId = employees["EMP-0009"];
  await db.attendanceEntry.deleteMany({ where: { employeeId: khalidId, date: daysAgo(3) } });
  await createShift(khalidId, daysAgo(3), "22:00", "02:00", 0, "PRESENT");

  // Split-shift (multiple attendance records same day) example for a waiter
  const samiId = employees["EMP-0005"];
  await db.attendanceEntry.deleteMany({ where: { employeeId: samiId, date: daysAgo(2) } });
  await createShift(samiId, daysAgo(2), "08:00", "12:00", 0, "PRESENT");
  await createShift(samiId, daysAgo(2), "14:00", "18:30", 0, "PRESENT");
}

async function seedFinancials(employees: Record<string, string>, createdById: string) {
  const today = daysAgo(0);

  // Advances
  const advanceDefs = [
    { emp: "EMP-0008", amount: "100.00", reason: "Family emergency" },
    { emp: "EMP-0005", amount: "50.00", reason: "Personal advance" },
    { emp: "EMP-0002", amount: "150.00", reason: "Medical expense" },
  ];
  for (const a of advanceDefs) {
    const employeeId = employees[a.emp];
    const date = daysAgo(10);
    const advance = await db.advance.create({
      data: {
        employeeId,
        date,
        amount: toPrismaDecimal(a.amount),
        remainingBalance: toPrismaDecimal(a.amount),
        reason: a.reason,
        createdById,
        transactions: { create: { date, amount: toPrismaDecimal(a.amount), type: "ISSUE" } },
      },
    });
    await appendLedgerEntry({ employeeId, date, type: "ADVANCE_ISSUED", description: `Advance: ${a.reason}`, debit: a.amount, sourceType: "Advance", sourceId: advance.id });
  }

  // Deductions
  await db.deduction.createMany({
    data: [
      { employeeId: employees["EMP-0010"], date: daysAgo(8), type: "DAMAGE", amount: toPrismaDecimal("15.00"), reason: "Vehicle damage", createdById },
      { employeeId: employees["EMP-0006"], date: daysAgo(6), type: "LATE", amount: toPrismaDecimal("5.00"), reason: "Repeated lateness", createdById },
    ],
  });

  // Bonuses
  await db.bonus.createMany({
    data: [
      { employeeId: employees["EMP-0008"], date: daysAgo(6), type: "Bonus", amount: toPrismaDecimal("25.00"), reason: "Excellent service", createdById },
      { employeeId: employees["EMP-0003"], date: daysAgo(15), type: "Extra Pay", amount: toPrismaDecimal("40.00"), reason: "Project completion", createdById },
    ],
  });

  // Overtime
  const otDefs = [
    { emp: "EMP-0008", minutes: 150, rate: 3.0 },
    { emp: "EMP-0002", minutes: 120, rate: 0 },
  ];
  for (const ot of otDefs) {
    const employeeId = employees[ot.emp];
    const employee = await db.employee.findUniqueOrThrow({ where: { id: employeeId } });
    const hourlyRate = ot.rate || Number(employee.hourlyRate) || 3;
    const amount = (ot.minutes / 60) * hourlyRate * 1.5;
    await db.overtimeEntry.create({
      data: {
        employeeId,
        date: daysAgo(7),
        normalMinutes: 480,
        overtimeMinutes: ot.minutes,
        overtimeRate: toPrismaDecimal(1.5),
        hourlyRateSnapshot: toPrismaDecimal(hourlyRate),
        overtimeAmount: toPrismaDecimal(amount.toFixed(2)),
        approved: true,
      },
    });
  }

  // Employee expenses / reimbursements
  await db.employeeExpense.createMany({
    data: [
      { employeeId: employees["EMP-0008"], date: daysAgo(6), amount: toPrismaDecimal("35.00"), expenseType: "Transportation", reason: "Company task", approvalStatus: "APPROVED", paymentStatus: "UNPAID", includeInPayroll: true, createdById },
      { employeeId: employees["EMP-0004"], date: daysAgo(4), amount: toPrismaDecimal("60.00"), expenseType: "Supplies", reason: "Front desk supplies", approvalStatus: "PENDING", paymentStatus: "UNPAID", includeInPayroll: true, createdById },
      { employeeId: employees["EMP-0009"], date: daysAgo(2), amount: toPrismaDecimal("12.50"), expenseType: "Transportation", reason: "Airport pickup", approvalStatus: "APPROVED", paymentStatus: "UNPAID", includeInPayroll: false, createdById },
    ],
  });

  // Leave requests
  await db.leaveRequest.createMany({
    data: [
      { employeeId: employees["EMP-0007"], leaveType: "ANNUAL", startDate: daysAgo(20), endDate: daysAgo(18), numberOfDays: toPrismaDecimal(3), status: "APPROVED", reason: "Family visit" },
      { employeeId: employees["EMP-0011"], leaveType: "SICK", startDate: daysAgo(9), endDate: daysAgo(9), numberOfDays: toPrismaDecimal(1), status: "APPROVED", reason: "Flu" },
      { employeeId: employees["EMP-0006"], leaveType: "EMERGENCY", startDate: daysAgo(1), endDate: today, numberOfDays: toPrismaDecimal(2), status: "PENDING", reason: "Family emergency" },
    ],
  });
}

async function seedUsers(employees: Record<string, string>) {
  const users = [
    { email: "admin@mayshr.com", name: "System Admin", role: "ADMIN" as const, password: "Admin@12345", employeeId: null },
    { email: "hr.manager@mayshr.com", name: "Sara Al-Khatib", role: "HR_MANAGER" as const, password: "Hr@123456", employeeId: null },
    { email: "hr.officer@mayshr.com", name: "Yousef Saleh", role: "HR_EMPLOYEE" as const, password: "Hr@123456", employeeId: employees["EMP-0003"] },
    { email: "accountant@mayshr.com", name: "Layla Hijazi", role: "ACCOUNTANT" as const, password: "Acc@123456", employeeId: employees["EMP-0002"] },
    { email: "manager@mayshr.com", name: "Ahmad Al-Rashid", role: "MANAGER" as const, password: "Mgr@123456", employeeId: employees["EMP-0001"] },
    { email: "dana.khalil@mayshr.com", name: "Dana Khalil", role: "EMPLOYEE" as const, password: "Emp@123456", employeeId: employees["EMP-0006"] },
  ];

  let adminId = "";
  for (const u of users) {
    const created = await db.user.create({
      data: { email: u.email, name: u.name, role: u.role, employeeId: u.employeeId, passwordHash: await hash(u.password) },
    });
    if (u.role === "ADMIN") adminId = created.id;
  }
  return adminId;
}

async function seedPayroll() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthlyPeriod = await db.payrollPeriod.create({
    data: { periodType: "MONTHLY", startDate: monthStart, endDate: daysAgo(0), label: monthStart.toLocaleString("en-US", { month: "long", year: "numeric" }) },
  });
  await generatePayrollPeriod(monthlyPeriod.id);

  const weekStart = daysAgo(6);
  const weeklyPeriod = await db.payrollPeriod.create({
    data: { periodType: "WEEKLY", startDate: weekStart, endDate: daysAgo(0), label: `Week of ${dateKey(weekStart)}` },
  });
  await generatePayrollPeriod(weeklyPeriod.id);

  const yesterday = daysAgo(1);
  const dailyPeriod = await db.payrollPeriod.create({
    data: { periodType: "DAILY", startDate: yesterday, endDate: yesterday, label: `Daily — ${dateKey(yesterday)}` },
  });
  await generatePayrollPeriod(dailyPeriod.id);

  // Record a partial payment against one monthly record for realism
  const oneRecord = await db.payrollRecord.findFirst({ where: { payrollPeriodId: monthlyPeriod.id } });
  if (oneRecord && Number(oneRecord.netPayable) > 0) {
    const partial = (Number(oneRecord.netPayable) * 0.6).toFixed(2);
    await db.$transaction([
      db.payrollRecord.update({
        where: { id: oneRecord.id },
        data: {
          paidAmount: toPrismaDecimal(partial),
          remainingAmount: toPrismaDecimal((Number(oneRecord.netPayable) - Number(partial)).toFixed(2)),
        },
      }),
      db.payment.create({
        data: { employeeId: oneRecord.employeeId, payrollRecordId: oneRecord.id, amount: toPrismaDecimal(partial), paymentDate: daysAgo(0), paymentMethod: "BANK_TRANSFER", referenceNumber: "TRX-0001" },
      }),
    ]);
    await appendLedgerEntry({ employeeId: oneRecord.employeeId, date: daysAgo(0), type: "PAYMENT", description: "Salary payment (bank transfer)", debit: partial, sourceType: "Payment" });
  }
}

async function main() {
  console.log("Resetting transactional data...");
  await resetTransactionalData();

  console.log("Seeding settings...");
  await db.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  console.log("Seeding departments, positions, holidays...");
  const { departments, positions } = await seedOrgStructure();

  console.log("Seeding employees...");
  const employees = await seedEmployees(departments, positions);

  console.log("Seeding users...");
  const adminId = await seedUsers(employees);

  console.log("Seeding attendance (35 days)...");
  await seedAttendance(employees);

  console.log("Seeding advances, deductions, bonuses, overtime, expenses, leave...");
  await seedFinancials(employees, adminId);

  console.log("Generating payroll (monthly, weekly, daily)...");
  await seedPayroll();

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
