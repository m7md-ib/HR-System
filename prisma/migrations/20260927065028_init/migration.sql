-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HR_MANAGER', 'HR_EMPLOYEE', 'ACCOUNTANT', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('DAILY', 'PART_TIME', 'FULL_TIME');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "DailyPayBasis" AS ENUM ('HOURLY', 'FIXED_DAILY');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'HOLIDAY', 'DAY_OFF');

-- CreateEnum
CREATE TYPE "PayrollType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'CALCULATED', 'REVIEWED', 'APPROVED', 'PAID', 'CLOSED', 'VOID');

-- CreateEnum
CREATE TYPE "AdvanceStatus" AS ENUM ('ACTIVE', 'PARTIALLY_SETTLED', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdvanceTxnType" AS ENUM ('ISSUE', 'DEDUCTION', 'CANCELLATION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "DeductionType" AS ENUM ('ABSENCE', 'LATE', 'SALARY_DEDUCTION', 'ADVANCE_DEDUCTION', 'DAMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExpensePaymentStatus" AS ENUM ('UNPAID', 'INCLUDED_IN_PAYROLL', 'PAID');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'EMERGENCY', 'UNPAID', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'VOID');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('ADVANCE_ISSUED', 'ADVANCE_DEDUCTION', 'SALARY', 'REIMBURSEMENT', 'DEDUCTION', 'BONUS', 'OVERTIME', 'ALLOWANCE', 'PAYMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'VOID', 'PAY', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LEAVE_PENDING', 'ADVANCE_PENDING', 'EXPENSE_PENDING', 'PAYROLL_READY', 'PAYROLL_APPROVED', 'PAYROLL_DUE', 'UNPAID_SALARY', 'OUTSTANDING_ADVANCE', 'UNPAID_REIMBURSEMENT', 'GENERAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "employeeId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "departmentId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "fullNameAr" TEXT NOT NULL,
    "fullNameEn" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "nationalId" TEXT,
    "dateOfBirth" DATE,
    "address" TEXT,
    "departmentId" TEXT,
    "positionId" TEXT,
    "jobTitle" TEXT,
    "employmentType" "EmploymentType" NOT NULL,
    "hireDate" DATE NOT NULL,
    "contractStartDate" DATE,
    "contractEndDate" DATE,
    "dailyPayBasis" "DailyPayBasis" NOT NULL DEFAULT 'HOURLY',
    "basicSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hourlyRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "dailyRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "weeklyRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monthlySalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankIban" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "notes" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "uploadedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_entries" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkIn" TIMESTAMPTZ(3),
    "checkOut" TIMESTAMPTZ(3),
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "workedMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "attendance_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "date" DATE NOT NULL,
    "type" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "numberOfDays" DECIMAL(6,2) NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "notes" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL,
    "periodType" "PayrollType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "label" TEXT NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMPTZ(3),
    "paidAt" TIMESTAMPTZ(3),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_records" (
    "id" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workedMinutes" INTEGER NOT NULL DEFAULT 0,
    "regularMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "workingDays" INTEGER NOT NULL DEFAULT 0,
    "absentDays" INTEGER NOT NULL DEFAULT 0,
    "leaveDays" INTEGER NOT NULL DEFAULT 0,
    "basicSalarySnapshot" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "regularEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "overtimeEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonusTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "allowanceTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reimbursementTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grossTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "advanceDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductionTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netPayable" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "calculatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" TEXT NOT NULL,
    "payrollRecordId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "sourceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "deductionMethod" TEXT NOT NULL DEFAULT 'INSTALLMENTS',
    "installments" INTEGER NOT NULL DEFAULT 1,
    "remainingBalance" DECIMAL(12,2) NOT NULL,
    "status" "AdvanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "advances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advance_transactions" (
    "id" TEXT NOT NULL,
    "advanceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "AdvanceTxnType" NOT NULL,
    "payrollRecordId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deductions" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "DeductionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "approvedById" TEXT,
    "payrollRecordId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bonuses" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Bonus',
    "reason" TEXT,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "approvedById" TEXT,
    "payrollRecordId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allowances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "notes" TEXT,
    "payrollRecordId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allowances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overtime_entries" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "normalMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL,
    "overtimeRate" DECIMAL(4,2) NOT NULL,
    "hourlyRateSnapshot" DECIMAL(12,2) NOT NULL,
    "overtimeAmount" DECIMAL(12,2) NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "payrollRecordId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "overtime_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_expenses" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "expenseType" TEXT NOT NULL,
    "reason" TEXT,
    "description" TEXT,
    "paidBy" TEXT,
    "receiptUrl" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "ExpensePaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "includeInPayroll" BOOLEAN NOT NULL DEFAULT true,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMPTZ(3),
    "payrollRecordId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "employee_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payrollRecordId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" DATE NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "referenceNumber" TEXT,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "voidedById" TEXT,
    "voidedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_ledger_entries" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "description" TEXT NOT NULL,
    "debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "targetRole" "Role",
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "companyName" TEXT NOT NULL DEFAULT 'MAYS HR',
    "companyNameAr" TEXT NOT NULL DEFAULT 'مايس للموارد البشرية',
    "currency" TEXT NOT NULL DEFAULT 'JOD',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Amman',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'ar',
    "weekStartsOn" INTEGER NOT NULL DEFAULT 6,
    "standardDailyMinutes" INTEGER NOT NULL DEFAULT 480,
    "standardMonthlyDays" INTEGER NOT NULL DEFAULT 30,
    "overtimeMultiplier" DECIMAL(4,2) NOT NULL DEFAULT 1.5,
    "lateGraceMinutes" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeNumber_key" ON "employees"("employeeNumber");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_employmentType_idx" ON "employees"("employmentType");

-- CreateIndex
CREATE INDEX "attendance_entries_employeeId_date_idx" ON "attendance_entries"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_date_key" ON "holidays"("date");

-- CreateIndex
CREATE INDEX "leave_requests_employeeId_idx" ON "leave_requests"("employeeId");

-- CreateIndex
CREATE INDEX "payroll_periods_periodType_startDate_idx" ON "payroll_periods"("periodType", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_records_payrollPeriodId_employeeId_key" ON "payroll_records"("payrollPeriodId", "employeeId");

-- CreateIndex
CREATE INDEX "advances_employeeId_idx" ON "advances"("employeeId");

-- CreateIndex
CREATE INDEX "deductions_employeeId_idx" ON "deductions"("employeeId");

-- CreateIndex
CREATE INDEX "bonuses_employeeId_idx" ON "bonuses"("employeeId");

-- CreateIndex
CREATE INDEX "allowances_employeeId_idx" ON "allowances"("employeeId");

-- CreateIndex
CREATE INDEX "overtime_entries_employeeId_idx" ON "overtime_entries"("employeeId");

-- CreateIndex
CREATE INDEX "employee_expenses_employeeId_idx" ON "employee_expenses"("employeeId");

-- CreateIndex
CREATE INDEX "payments_employeeId_idx" ON "payments"("employeeId");

-- CreateIndex
CREATE INDEX "employee_ledger_entries_employeeId_date_idx" ON "employee_ledger_entries"("employeeId", "date");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_entries" ADD CONSTRAINT "attendance_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_entries" ADD CONSTRAINT "attendance_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payrollRecordId_fkey" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advances" ADD CONSTRAINT "advances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advances" ADD CONSTRAINT "advances_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advance_transactions" ADD CONSTRAINT "advance_transactions_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "advances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advance_transactions" ADD CONSTRAINT "advance_transactions_payrollRecordId_fkey" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deductions" ADD CONSTRAINT "deductions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deductions" ADD CONSTRAINT "deductions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deductions" ADD CONSTRAINT "deductions_payrollRecordId_fkey" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deductions" ADD CONSTRAINT "deductions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_payrollRecordId_fkey" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allowances" ADD CONSTRAINT "allowances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allowances" ADD CONSTRAINT "allowances_payrollRecordId_fkey" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_entries" ADD CONSTRAINT "overtime_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_entries" ADD CONSTRAINT "overtime_entries_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_entries" ADD CONSTRAINT "overtime_entries_payrollRecordId_fkey" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_expenses" ADD CONSTRAINT "employee_expenses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_expenses" ADD CONSTRAINT "employee_expenses_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_expenses" ADD CONSTRAINT "employee_expenses_payrollRecordId_fkey" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_expenses" ADD CONSTRAINT "employee_expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payrollRecordId_fkey" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_ledger_entries" ADD CONSTRAINT "employee_ledger_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
