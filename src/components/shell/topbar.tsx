"use client";

import Link from "next/link";
import { Menu, Bell, ChevronDown, LogOut, UserRound } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { LanguageSwitch } from "./language-switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/actions/auth";
import type { Role } from "@/lib/auth/rbac";

export function Topbar({
  name,
  role,
  unreadCount,
  onMenuClick,
}: {
  name: string;
  role: Role;
  unreadCount: number;
  onMenuClick: () => void;
}) {
  const { dict } = useI18n();

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-[var(--radius-sm)] p-2 text-muted hover:bg-muted-surface lg:hidden"
          aria-label="menu"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <LanguageSwitch />

        <Link
          href="/notifications"
          className="relative rounded-full p-2 text-muted hover:bg-muted-surface hover:text-foreground"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 end-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-[var(--radius-sm)] py-1.5 ps-1 pe-2 text-sm hover:bg-muted-surface focus:outline-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
              <UserRound size={16} />
            </div>
            <span className="hidden text-start sm:block">
              <span className="block text-xs font-semibold text-foreground">{name}</span>
              <span className="block text-[11px] text-muted">{dict.roles[role]}</span>
            </span>
            <ChevronDown size={14} className="text-muted" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link href="/me">
                <UserRound size={15} /> {dict.common.profile}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logoutAction} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2 text-danger">
                  <LogOut size={15} /> {dict.common.logout}
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
