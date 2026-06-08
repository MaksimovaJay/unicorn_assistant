"use client";

import { EVENT_COLORS, EVENT_TYPE_LABELS } from "@/lib/calendar-utils";
import type { EventType } from "@/types/database";
import { cn } from "@/lib/utils";

interface CalendarFiltersProps {
  activeTypes: EventType[];
  onToggleType: (type: EventType) => void;
}

const ALL_TYPES = Object.keys(EVENT_TYPE_LABELS) as EventType[];

export function CalendarFilters({ activeTypes, onToggleType }: CalendarFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 px-1">
      {ALL_TYPES.map((type) => {
        const isActive = activeTypes.includes(type);
        const colors = EVENT_COLORS[type];
        return (
          <button
            key={type}
            onClick={() => onToggleType(type)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 border",
              isActive
                ? "opacity-100 border-transparent"
                : "opacity-40 bg-transparent border-border"
            )}
            style={isActive ? { backgroundColor: colors.bg, color: colors.text } : undefined}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors.bg }}
            />
            {EVENT_TYPE_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}
