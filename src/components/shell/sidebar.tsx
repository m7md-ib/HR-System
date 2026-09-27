"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/config/nav";
import { can, type Role } from "@/lib/auth/rbac";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function Sidebar({ role, open, onNavigate }: { role: Role; open: boolean; onNavigate?: () => void }) {
  const { dict } = useI18n();
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => !item.resource || can(role, item.resource, "view"));

  return (
    <aside
      className={cn(
        "z-40 flex w-64 shrink-0 flex-col border-e border-border bg-surface transition-transform",
        "max-lg:fixed max-lg:inset-y-0 max-lg:start-0 lg:static",
        open ? "max-lg:translate-x-0" : "max-lg:-translate-x-full max-lg:rtl:translate-x-full",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-primary text-sm font-bold text-primary-foreground">
          M
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-foreground">MAYS HR</p>
          <p className="text-[11px] text-muted">Hospitality &amp; Business</p>
        </div>
      </div>
      <nav className="scrollbar-thin flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-soft text-primary-dark"
                      : "text-muted hover:bg-muted-surface hover:text-foreground",
                  )}
                >
                  <Icon size={17} strokeWidth={2} />
                  {dict.nav[item.key]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
