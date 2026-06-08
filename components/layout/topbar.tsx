"use client";

import { useRouter } from "next/navigation";
import { Bell, Search, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-[72px] bg-surface border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1 max-w-md relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
        />
        <Input
          placeholder="Поиск... (Cmd+K)"
          className="pl-9 h-10 rounded-full border-border bg-background text-sm font-semibold"
          readOnly
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-background"
        >
          <Bell size={20} className="text-text-secondary" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="h-10 w-10 rounded-full hover:bg-background"
          title="Выйти"
        >
          <LogOut size={18} className="text-text-secondary" />
        </Button>
      </div>
    </header>
  );
}
