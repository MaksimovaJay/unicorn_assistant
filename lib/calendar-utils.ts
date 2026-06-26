import type { EventType, EventStatus, Event } from "@/types/database";
import type { EventInput } from "@fullcalendar/core";

export const EVENT_COLORS: Record<EventType, { bg: string; text: string }> = {
  meeting:      { bg: "#F996A5", text: "#ffffff" },
  consultation: { bg: "#FB923C", text: "#ffffff" },
  training:     { bg: "#2DD4BF", text: "#ffffff" },
  call:         { bg: "#93C5FD", text: "#1e3a5f" },
  personal:     { bg: "#C084FC", text: "#ffffff" },
  other:        { bg: "#3B82F6", text: "#ffffff" },
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting:      "Оффлайн встреча",
  consultation: "Консультация",
  training:     "Супервизия",
  call:         "Менторство",
  personal:     "Личное",
  other:        "Выходной",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  planned:     "Запланировано",
  confirmed:   "Подтверждено",
  completed:   "Завершено",
  cancelled:   "Отменено",
  rescheduled: "Перенесено",
};

export function toFCEvent(event: Event): EventInput {
  const colors = EVENT_COLORS[event.event_type];
  return {
    id: event.id,
    title: event.title,
    start: event.start_at,
    end: event.end_at,
    allDay: event.all_day,
    backgroundColor: colors.bg,
    borderColor: colors.bg,
    textColor: colors.text,
    extendedProps: {
      event_type: event.event_type,
      status: event.status,
      description: event.description,
      location: event.location,
      notes: event.notes,
      contact_id: event.contact_id,
    },
  };
}

export function detectConflicts(
  events: Event[],
  startAt: string,
  endAt: string,
  excludeId?: string
): Event[] {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  return events.filter((e) => {
    if (e.id === excludeId || e.all_day) return false;
    const eStart = new Date(e.start_at).getTime();
    const eEnd = new Date(e.end_at).getTime();
    return start < eEnd && end > eStart;
  });
}
