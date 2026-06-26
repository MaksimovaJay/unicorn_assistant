"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, User, CalendarDays, CheckSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SearchResult {
  contacts: { id: string; full_name: string; telegram: string | null; phone: string | null }[];
  events: { id: string; title: string; start_at: string; event_type: string }[];
  tasks: { id: string; title: string; status: string }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ contacts: [], events: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults({ contacts: [], events: [], tasks: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setResults({ contacts: [], events: [], tasks: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = useCallback((path: string) => {
    router.push(path);
    onClose();
  }, [router, onClose]);

  const total = results.contacts.length + results.events.length + results.tasks.length;
  const hasQuery = query.length >= 2;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск контактов, событий, задач..."
            className="flex-1 bg-transparent text-sm outline-none text-text-primary placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === "Escape" && onClose()}
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-text-primary">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <p className="text-xs text-muted-foreground text-center py-6">Поиск...</p>
          )}

          {!loading && hasQuery && total === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">Ничего не найдено</p>
          )}

          {!loading && results.contacts.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Контакты</p>
              {results.contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleNavigate("/contacts")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <User size={14} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{c.full_name}</p>
                    {(c.telegram || c.phone) && (
                      <p className="text-xs text-muted-foreground">{c.telegram ?? c.phone}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && results.events.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">События</p>
              {results.events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => handleNavigate("/calendar")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <CalendarDays size={14} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.start_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", timeZone: "Europe/Moscow" })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && results.tasks.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Задачи</p>
              {results.tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleNavigate("/tasks")}
                  className={cn("w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left")}
                >
                  <CheckSquare size={14} className="text-muted-foreground flex-shrink-0" />
                  <p className="text-sm font-medium text-text-primary">{t.title}</p>
                </button>
              ))}
            </div>
          )}

          {!hasQuery && (
            <p className="text-xs text-muted-foreground text-center py-6">Начни вводить для поиска</p>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border flex gap-3 text-[10px] text-muted-foreground">
          <span>↵ перейти</span>
          <span>Esc закрыть</span>
        </div>
      </div>
    </div>
  );
}
