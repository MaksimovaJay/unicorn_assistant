"use client";

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { DateClickArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import { useEvents, useUpdateEvent } from "@/hooks/use-events";
import { toFCEvent } from "@/lib/calendar-utils";
import { EventDialog } from "@/components/calendar/event-dialog";
import { EventPopover } from "@/components/calendar/event-popover";
import { CalendarFilters } from "@/components/calendar/calendar-filters";
import type { Event, EventType } from "@/types/database";

const ALL_TYPES: EventType[] = ["meeting", "consultation", "training", "call", "personal", "other"];

export function CalendarView() {
  const { data: events = [], isLoading } = useEvents();
  const updateEvent = useUpdateEvent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStart, setDialogStart] = useState<string | undefined>();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [popoverEvent, setPopoverEvent] = useState<Event | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

  const [activeTypes, setActiveTypes] = useState<EventType[]>(ALL_TYPES);

  function toggleType(type: EventType) {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function handleDateClick(arg: DateClickArg) {
    setEditingEvent(null);
    setDialogStart(arg.dateStr);
    setDialogOpen(true);
  }

  function handleEventClick(arg: EventClickArg) {
    const id = arg.event.id;
    const found = events.find((e) => e.id === id) ?? null;
    setPopoverEvent(found);
    setPopoverAnchor(arg.el as HTMLElement);
  }

  async function handleEventDrop(arg: EventDropArg) {
    if (!arg.event.start) return;
    const duration = arg.event.end
      ? arg.event.end.getTime() - arg.event.start.getTime()
      : 60 * 60 * 1000;
    await updateEvent.mutateAsync({
      id: arg.event.id,
      start_at: arg.event.start.toISOString(),
      end_at: new Date(arg.event.start.getTime() + duration).toISOString(),
    });
  }

  async function handleEventResize(arg: EventResizeDoneArg) {
    if (!arg.event.start || !arg.event.end) return;
    await updateEvent.mutateAsync({
      id: arg.event.id,
      start_at: arg.event.start.toISOString(),
      end_at: arg.event.end.toISOString(),
    });
  }

  const filteredEvents = events
    .filter((e) => activeTypes.includes(e.event_type))
    .map(toFCEvent);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 bg-muted rounded-full animate-pulse w-96" />
        <div className="h-[600px] bg-muted rounded-[20px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CalendarFilters activeTypes={activeTypes} onToggleType={toggleType} />

      <div className="bg-surface rounded-[20px] shadow-card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          buttonText={{
            today: "Сегодня",
            month: "Месяц",
            week: "Неделя",
            day: "День",
            list: "Список",
          }}
          locale="ru"
          firstDay={1}
          height="auto"
          events={filteredEvents}
          editable
          selectable
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          nowIndicator
        />
      </div>

      <EventDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingEvent(null); }}
        defaultStart={dialogStart}
        editEvent={editingEvent}
        allEvents={events}
      />

      <EventPopover
        event={popoverEvent}
        anchorEl={popoverAnchor}
        onClose={() => { setPopoverEvent(null); setPopoverAnchor(null); }}
        onEdit={(event) => {
          setEditingEvent(event);
          setDialogOpen(true);
          setPopoverEvent(null);
          setPopoverAnchor(null);
        }}
      />
    </div>
  );
}
