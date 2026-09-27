import type { Role } from "@/generated/prisma/client";

export type { Role };

export type Resource =
  | "employees"
  | "attendance"
  | "payroll"
  | "advances"
  | "deductions"
  | "bonuses"
  | "overtime"
  | "expenses"
  | "leave"
  | "holidays"
  | "departments"
  | "positions"
  | "reports"
  | "payments"
  | "settings"
  | "users"
  | "audit"
  | "notifications"
  | "ledger";

export type Action = "view" | "create" | "edit" | "delete" | "approve" | "pay" | "export";

type Matrix = Record<Role, Partial<Record<Resource, readonly Action[]>>>;

const ALL: Action[] = ["view", "create", "edit", "delete", "approve", "pay", "export"];
const VCE: Action[] = ["view", "create", "edit"];
const VC: Action[] = ["view", "create"];
const V: Action[] = ["view"];
const VCEA: Action[] = ["view", "create", "edit", "approve"];
const VCEAX: Action[] = ["view", "create", "edit", "approve", "export"];
const VCEAP: Action[] = ["view", "create", "edit", "approve", "pay"];
const VA: Action[] = ["view", "approve"];
const VX: Action[] = ["view", "export"];

/**
 * Role -> resource -> allowed actions. This governs directory/collection
 * access. It does NOT express "own record" scoping (e.g. an EMPLOYEE
 * viewing their own profile/ledger/payslips) — pages must check that
 * separately by comparing the record's employeeId to the caller's own
 * user.employeeId.
 */
const MATRIX: Matrix = {
  ADMIN: {
    employees: ALL, attendance: ALL, payroll: ALL, advances: ALL, deductions: ALL,
    bonuses: ALL, overtime: ALL, expenses: ALL, leave: ALL, holidays: ALL,
    departments: ALL, positions: ALL, reports: ALL, payments: ALL, settings: ALL,
    users: ALL, audit: V, notifications: ALL, ledger: ALL,
  },
  HR_MANAGER: {
    employees: VCEA, attendance: VCEA, payroll: VCEAX,
    advances: VCEA, deductions: VCEA, bonuses: VCEA, overtime: VCEA, expenses: VCEA,
    leave: VCEA, holidays: VCE, departments: VCE, positions: VCE,
    reports: VX, payments: VC, settings: V,
    audit: V, notifications: V, ledger: V,
  },
  HR_EMPLOYEE: {
    employees: VCE, attendance: VCE, payroll: V, advances: VC, deductions: VC,
    bonuses: VC, overtime: VC, expenses: VC, leave: VC, holidays: V,
    departments: V, positions: V, reports: V, notifications: V, ledger: V,
  },
  ACCOUNTANT: {
    employees: V, attendance: V, payroll: VCEAP, advances: VCEA, deductions: VCEA,
    bonuses: VCEA, overtime: VCEA, expenses: VCEA, leave: V, holidays: V,
    departments: V, positions: V, reports: VX, payments: VCEAP,
    settings: V, audit: V, notifications: V, ledger: V,
  },
  MANAGER: {
    employees: V, attendance: V, payroll: V, advances: VA,
    deductions: VA, bonuses: VA, overtime: VA,
    expenses: VA, leave: VA, holidays: V,
    departments: V, positions: V, reports: VX, payments: V, notifications: V, ledger: V,
  },
  EMPLOYEE: {
    advances: VC, expenses: VC, leave: VC, holidays: V, notifications: V, ledger: V,
  },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  return MATRIX[role]?.[resource]?.includes(action) ?? false;
}

export function anyOf(role: Role, resource: Resource, actions: Action[]): boolean {
  return actions.some((a) => can(role, resource, a));
}

export const ROLE_LABELS: Record<Role, { en: string; ar: string }> = {
  ADMIN: { en: "Admin", ar: "مدير النظام" },
  HR_MANAGER: { en: "HR Manager", ar: "مدير الموارد البشرية" },
  HR_EMPLOYEE: { en: "HR Employee", ar: "موظف الموارد البشرية" },
  ACCOUNTANT: { en: "Accountant", ar: "محاسب" },
  MANAGER: { en: "Manager", ar: "مدير" },
  EMPLOYEE: { en: "Employee", ar: "موظف" },
};
