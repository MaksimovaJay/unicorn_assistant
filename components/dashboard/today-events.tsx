"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTodayEvents } from "@/hooks/use-dashboard";
import type { EventType } from "@/types/database";

const TYPE_CONFIG: Record<EventType, { icon: string; label: string; stripe: string }> = {
  call:         { icon: "📞", label: "Звонок",        stripe: "border-l-blue-400" },
  consultation: { icon: "💬", label: "Консультация",  stripe: "border-l-indigo-400" },
  training:     { icon: "🏋️", label: "Тренинг",       stripe: "border-l-green-400" },
  meeting:      { icon: "🤝", label: "Встреча",       stripe: "border-l-purple-400" },
  personal:     { icon: "⭐", label: "Личное",        stripe: "border-l-amber-400" },
  other:        { icon: "📌", label: "Другое",        stripe: "border-l-gray-400" },
};

function formatTime(dateStr: string, allDay: boolean): string {
  if (allDay) return "Весь день";
  return new Date(dateStr).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TodayEvents() {
  const router = useRouter();
  const { data: events = [], isLoading } = useTodayEvents();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <CalendarDays size={36} className="mb-3 opacity-25" />
        <p className="font-semibold">Событий на сегодня нет</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const cfg = TYPE_CONFIG[event.event_type];
        const cancelled = event.status === "cancelled";
        return (
          <div
            key={event.id}
            onClick={() => router.push("/calendar")}
            className={cn(
              "flex flex-col gap-1 p-3 bg-surface border border-border rounded-xl",
              "border-l-4 cursor-pointer hover:shadow-sm transition-shadow",
              cfg.stripe,
              cancelled && "opacity-50"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                {cfg.icon} {cfg.label}
              </span>
              <span className="text-sm font-semibold text-text-primary ml-auto">
                {formatTime(event.start_at, event.all_day)}
              </span>
              {event.telegram && (
                <a
                  href={event.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                >
                  <Send size={14} />
                </a>
              )}
            </div>
            <p className={cn(
              "text-sm font-bold text-text-primary",
              cancelled && "line-through"
            )}>
              {event.title}
            </p>
          </div>
        );
      })}
    </div>
  );
}
