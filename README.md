# MAYS HR — HR Management & Payroll System

A production-shaped HR and payroll system for a hotel/business environment: employees,
attendance (with real time-math, never decimal-hour guessing), daily/weekly/monthly
payroll, advances, deductions, bonuses, overtime, employee reimbursements, a per-employee
financial ledger, reports with Excel export, role-based access, and full Arabic/English
RTL support.

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions)
- **PostgreSQL** via **Prisma 7** (driver adapter: `@prisma/adapter-pg`)
- **Session-based auth**: bcrypt password hashes, opaque random session tokens hashed
  and stored server-side (no JWT) — real revocation, not just expiry
- **Tailwind CSS v4** + Radix UI primitives for the component kit
- **Recharts** for dashboard charts, **exceljs** for Excel export
- **Vitest** for the time/payroll engine test suite

## Getting started

```bash
npm install
cp .env.example .env   # set DATABASE_URL and SESSION_SECRET
npx prisma migrate dev # applies prisma/migrations
npm run db:seed        # realistic demo data (12 employees, 35 days of attendance,
                        # generated payroll, advances, etc.)
npm run dev
```

Demo accounts (see `prisma/seed.ts`):

| Role | Email | Password |
|---|---|---|
| Admin | admin@mayshr.com | Admin@12345 |
| HR Manager | hr.manager@mayshr.com | Hr@123456 |
| HR Employee | hr.officer@mayshr.com | Hr@123456 |
| Accountant | accountant@mayshr.com | Acc@123456 |
| Manager | manager@mayshr.com | Mgr@123456 |
| Employee (self-service) | dana.khalil@mayshr.com | Emp@123456 |

```bash
npm test        # time + payroll engine unit tests
npm run build   # production build
npm run lint
```

## Architecture

**The most important rule in this codebase**: durations are integer **minutes**, never
decimal hours. `src/lib/time/engine.ts` is the single place that converts between
clock times, minutes, and the `HH:MM` display format; it handles overnight shifts,
multiple shifts per day, and breaks. `src/lib/payroll/engine.ts` is the single place
that turns minutes and rates into money, using `decimal.js` throughout (never
floating-point arithmetic) via `src/lib/money.ts`. Both are unit-tested in
`*.test.ts` against the exact worked examples from the spec (06:30 + 02:20 = 08:50;
08:50 @ 3.00 JOD/hr = 26.50 JOD; the full Mohammad financial-summary example).
Nothing outside these two files should compute a duration or a wage.

`src/lib/payroll/generate.ts` is the payroll run itself: for a period, it finds every
eligible employee (by employment type), pulls their attendance/overtime/bonuses/
allowances/deductions/payroll-eligible reimbursements, computes base pay per the
employee's pay basis, and distributes any advance recoupment across their oldest
advances — all in one DB transaction, with a full line-item breakdown persisted for
the "view details" screen.

`src/lib/ledger.ts` maintains one running per-employee balance ("net amount the
company still owes them"): advances debit at issuance (cash already moved), earnings/
bonuses/reimbursements credit when a payroll period is finalized, and payments debit
when cash actually goes out. This is deliberately designed so a payroll's advance
recoupment does **not** double-debit — the debit already happened at issuance.

Every mutation goes through a Server Action in `src/actions/`, gated by
`requirePermission(resource, action)` (`src/lib/auth/rbac.ts`), and writes an
`AuditLog` row. Financial records are voided, not deleted.

### A note on Decimal fields and Client Components

Prisma's `Decimal` values cannot cross the Server → Client component boundary (React
throws at runtime, not build time). Every query that feeds a Client Component either
uses a narrow `select` (see `src/lib/queries/employee-options.ts`) or converts Decimals
to strings first (`src/lib/serialize.ts`). If you add a new page, follow that pattern —
don't pass a raw Prisma record with `include:` into a `"use client"` component.

## What's genuinely built vs. simplified

This is a large spec (60+ sections). Everything under employees, attendance, the time
engine, the payroll engine, advances/deductions/bonuses/overtime/reimbursements, the
ledger, leave, holidays, payments, dashboard, RBAC, audit log, and i18n/RTL is real:
real database, real calculations, real validation, verified end-to-end against the
spec's own worked examples through the actual UI (not just unit tests).

Known, deliberate simplifications:
- **Reports**: the existing list pages (Attendance, Advances, Deductions, Bonuses,
  Overtime, Expenses, Payments, Leave) double as their own reports. Five additional
  aggregate reports were built with real Excel export (Payroll Summary, Department
  Payroll, Absence, Advance Balance, Employee Ledger). Not all 21 named reports in the
  spec have a dedicated page; most of that data is reachable through an existing page.
- **PDF**: reports use a print stylesheet (browser "Print to PDF") rather than a
  server-rendered PDF file.
- **Notifications**: wired into the three highest-value triggers (leave request created,
  expense pending approval, payroll generated) rather than every possible event in
  section 32.
- **Payroll period workflow**: implemented as Draft → Calculated → Approved → Closed;
  the spec's `Reviewed`/`Paid` intermediate statuses exist on the schema but aren't
  separately exposed as UI actions.
- Employee self-service (the `EMPLOYEE` role) can view/cancel their own leave and
  expenses and view their own profile; it hasn't been extended to every module.
