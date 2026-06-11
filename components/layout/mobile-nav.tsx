"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, CheckSquare, Users,
  BookOpen, CreditCard, FileText, FolderOpen, Link2, Settings,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Календарь", icon: Calendar },
  { href: "/tasks", label: "Задачи", icon: CheckSquare },
  { href: "/contacts", label: "Контакты", icon: Users },
];

const moreItems = [
  { href: "/bookings", label: "Записи", icon: BookOpen },
  { href: "/payments", label: "Платежи", icon: CreditCard },
  { href: "/notes", label: "Заметки", icon: FileText },
  { href: "/files", label: "Файлы", icon: FolderOpen },
  { href: "/links", label: "Ссылки", icon: Link2 },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isMoreActive = moreItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div className="fixed bottom-16 left-0 right-0 z-50 bg-surface border-t border-border px-4 py-3 grid grid-cols-3 gap-2 md:hidden">
          {moreItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2 rounded-[12px] text-xs font-semibold transition-colors",
                  isActive ? "text-primary bg-primary/10" : "text-text-secondary"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border flex md:hidden safe-area-pb">
        {mainItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors",
                isActive ? "text-primary" : "text-text-secondary"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="hidden xs:block">{label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors",
            (open || isMoreActive) ? "text-primary" : "text-text-secondary"
          )}
        >
          <MoreHorizontal size={22} strokeWidth={2} />
          <span className="hidden xs:block">Ещё</span>
        </button>
      </nav>
    </>
  );
}
