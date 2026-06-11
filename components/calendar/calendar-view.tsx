"use client";

import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ruLocale from "@fullcalendar/core/locales/ru";
import type { EventClickArg, EventDropArg, DatesSetArg } from "@fullcalendar/core";
import type { DateClickArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import { useEvents, useUpdateEvent } from "@/hooks/use-events";
import { toFCEvent } from "@/lib/calendar-utils";
import { EventDialog } from "@/components/calendar/event-dialog";
import { EventPopover } from "@/components/calendar/event-popover";
import { CalendarFilters } from "@/components/calendar/calendar-filters";
import type { Event, EventType } from "@/types/database";
import { cn } from "@/lib/utils";

const ALL_TYPES: EventType[] = ["meeting", "consultation", "training", "call", "personal", "other"];

const VIEW_OPTIONS = [
  { view: "dayGridMonth", label: "Месяц" },
  { view: "timeGridWeek", label: "Неделя" },
  { view: "timeGridDay", label: "День" },
  { view: "listWeek", label: "Список" },
];

export function CalendarView() {
  const { data: events = [], isLoading } = useEvents();
  const updateEvent = useUpdateEvent();
  const calendarRef = useRef<FullCalendar>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStart, setDialogStart] = useState<string | undefined>();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [popoverEvent, setPopoverEvent] = useState<Event | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

  const [activeTypes, setActiveTypes] = useState<EventType[]>(ALL_TYPES);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function changeView(view: string) {
    calendarRef.current?.getApi().changeView(view);
    setCurrentView(view);
  }

  function toggleType(type: EventType) {
    if (activeTypes.length === ALL_TYPES.length) {
      setActiveTypes([type]);
    } else if (activeTypes.length === 1 && activeTypes[0] === type) {
      setActiveTypes(ALL_TYPES);
    } else {
      setActiveTypes((prev) =>
        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
      );
    }
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

      <div className="bg-surface rounded-[20px] shadow-card p-2 md:p-4 overflow-hidden">
        <div className="flex gap-1 justify-center mb-2">
          {VIEW_OPTIONS.map(({ view, label }) => (
            <button
              key={view}
              onClick={() => changeView(view)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150",
                currentView === view
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next",
            center: "title",
            right: "today",
          }}
          footerToolbar={undefined}
          buttonText={{
            today: "Сегодня",
            month: "Месяц",
            week: "Неделя",
            day: "День",
            list: "Список",
          }}
          locale={ruLocale}
          firstDay={1}
          height="auto"
          events={filteredEvents}
          editable
          selectable
          navLinks
          navLinkDayClick="timeGridDay"
          dayMaxEvents={isMobile ? 2 : 3}
          moreLinkText={(n) => `+${n}`}
          displayEventTime={!isMobile}
          eventDisplay={isMobile ? "list-item" : "block"}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          nowIndicator
          datesSet={(arg: DatesSetArg) => setCurrentView(arg.view.type)}
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
