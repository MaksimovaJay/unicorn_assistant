"use client";

import { useState, useEffect } from "react";
import { Bell, Search, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/search/command-palette";

export function Topbar() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      <header className="h-[72px] bg-surface border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
        <div className="flex-1 max-w-md relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full h-10 pl-9 pr-4 rounded-full border border-border bg-background text-sm font-semibold text-muted-foreground text-left hover:border-primary/40 transition-colors"
          >
            Поиск... (Cmd+K)
          </button>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Уведомления"
            className="h-10 w-10 rounded-full hover:bg-background"
          >
            <Bell size={20} className="text-text-secondary" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            aria-label="Выйти"
            className="h-10 w-10 rounded-full hover:bg-background"
          >
            <LogOut size={18} className="text-text-secondary" />
          </Button>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
