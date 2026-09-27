import {
  LayoutDashboard,
  Users,
  Clock,
  Timer,
  Wallet,
  HandCoins,
  MinusCircle,
  Gift,
  TimerReset,
  Receipt,
  CalendarOff,
  PartyPopper,
  Building2,
  Briefcase,
  FileBarChart,
  CreditCard,
  Bell,
  History,
  UserCog,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Resource } from "@/lib/auth/rbac";
import type { Dictionary } from "@/i18n/dictionaries/ar";

export interface NavItem {
  key: keyof Dictionary["nav"];
  href: string;
  icon: LucideIcon;
  resource?: Resource;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "employees", href: "/employees", icon: Users, resource: "employees" },
  { key: "attendance", href: "/attendance", icon: Clock, resource: "attendance" },
  { key: "workingHours", href: "/working-hours", icon: Timer, resource: "attendance" },
  { key: "payroll", href: "/payroll", icon: Wallet, resource: "payroll" },
  { key: "advances", href: "/advances", icon: HandCoins, resource: "advances" },
  { key: "deductions", href: "/deductions", icon: MinusCircle, resource: "deductions" },
  { key: "bonuses", href: "/bonuses", icon: Gift, resource: "bonuses" },
  { key: "overtime", href: "/overtime", icon: TimerReset, resource: "overtime" },
  { key: "expenses", href: "/expenses", icon: Receipt, resource: "expenses" },
  { key: "leave", href: "/leave", icon: CalendarOff, resource: "leave" },
  { key: "holidays", href: "/holidays", icon: PartyPopper, resource: "holidays" },
  { key: "departments", href: "/departments", icon: Building2, resource: "departments" },
  { key: "positions", href: "/positions", icon: Briefcase, resource: "positions" },
  { key: "reports", href: "/reports", icon: FileBarChart, resource: "reports" },
  { key: "payments", href: "/payments", icon: CreditCard, resource: "payments" },
  { key: "notifications", href: "/notifications", icon: Bell },
  { key: "auditLog", href: "/audit-log", icon: History, resource: "audit" },
  { key: "users", href: "/users", icon: UserCog, resource: "users" },
  { key: "settings", href: "/settings", icon: Settings, resource: "settings" },
];
