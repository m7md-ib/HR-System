"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { Role } from "@/lib/auth/rbac";

export function AppShell({
  role,
  name,
  unreadCount,
  children,
}: {
  role: Role;
  name: string;
  unreadCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={role} open={open} onNavigate={() => setOpen(false)} />
      {open && (
        <button
          aria-label="close menu"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar name={name} role={role} unreadCount={unreadCount} onMenuClick={() => setOpen(true)} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
