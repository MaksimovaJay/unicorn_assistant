"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Users,
  BookOpen,
  CreditCard,
  FileText,
  FolderOpen,
  Activity,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Календарь", icon: Calendar },
  { href: "/tasks", label: "Задачи", icon: CheckSquare },
  { href: "/contacts", label: "Контакты", icon: Users },
  { href: "/bookings", label: "Записи", icon: BookOpen },
  { href: "/payments", label: "Платежи", icon: CreditCard },
  { href: "/notes", label: "Заметки", icon: FileText },
  { href: "/files", label: "Файлы", icon: FolderOpen },
  { href: "/activity", label: "Активность", icon: Activity },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] min-h-screen bg-surface border-r border-border flex flex-col flex-shrink-0">
      <div className="h-[72px] flex items-center px-6 border-b border-border">
        <span className="text-xl font-black text-text-primary">🦄 Unicorn</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-background hover:text-text-primary"
              )}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 2}
                className="flex-shrink-0"
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
