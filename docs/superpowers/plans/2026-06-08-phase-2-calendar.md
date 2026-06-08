# Phase 2: Calendar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional calendar module with FullCalendar (4 views), CRUD events, drag-and-drop rescheduling, event type colors, and conflict detection.

**Architecture:** FullCalendar v6 wrapped in a `"use client"` component, loaded via `next/dynamic` with `ssr: false` to avoid SSR issues. Events are fetched via React Query from Next.js API routes that use the server Supabase client (RLS-filtered by workspace). Create/edit via a Shadcn Dialog form. Click-to-view via a Shadcn Popover. Conflict detection runs client-side before save and shows a non-blocking warning.

**Tech Stack:** @fullcalendar/react v6, @fullcalendar/daygrid, @fullcalendar/timegrid, @fullcalendar/interaction, @fullcalendar/list, react-hook-form, zod, @tanstack/react-query, Shadcn Dialog/Popover/Select/Textarea

---

## File Map

| File | Responsibility |
|------|---------------|
| `app/(workspace)/calendar/page.tsx` | Calendar page — loads CalendarView via dynamic import (ssr:false) |
| `app/api/events/route.ts` | GET (list all workspace events) + POST (create) |
| `app/api/events/[id]/route.ts` | PUT (update) + DELETE |
| `components/calendar/calendar-view.tsx` | FullCalendar client component — all views, drag/drop, click handlers |
| `components/calendar/event-dialog.tsx` | Create/edit modal with react-hook-form + zod |
| `components/calendar/event-popover.tsx` | Click-to-view event details with edit/delete actions |
| `components/calendar/calendar-filters.tsx` | Filter chips by event type + status |
| `hooks/use-events.ts` | React Query hooks: useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent |
| `lib/calendar-utils.ts` | EVENT_COLORS map, EVENT_TYPE_LABELS, STATUS_LABELS, toFCEvent(), detectConflicts() |

---

## Task 1: Install Dependencies + Shadcn Components

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install FullCalendar packages**

```bash
cd "c:\Users\evgen\OneDrive\Desktop\THMJAY WORK\unicorn_assistant\unicorn_assistant_web"
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/list
```

Expected: All packages install without error. FullCalendar v6.x is installed.

- [ ] **Step 2: Add Shadcn Dialog, Select, Textarea, Popover**

```bash
npx shadcn@latest add dialog select textarea popover
```

Expected: 4 new files appear in `components/ui/`: `dialog.tsx`, `select.tsx`, `textarea.tsx`, `popover.tsx`.

- [ ] **Step 3: Verify TypeScript still passes**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json components/ui/
git commit -m "feat: install FullCalendar v6, add Shadcn dialog/select/textarea/popover"
```

---

## Task 2: Calendar Utilities

**Files:**
- Create: `lib/calendar-utils.ts`

- [ ] **Step 1: Create `lib/calendar-utils.ts`**

```typescript
import type { EventType, EventStatus, Event } from "@/types/database";
import type { EventInput } from "@fullcalendar/core";

export const EVENT_COLORS: Record<EventType, { bg: string; text: string }> = {
  meeting:      { bg: "#F996A5", text: "#ffffff" },
  consultation: { bg: "#FABE3E", text: "#2D2020" },
  training:     { bg: "#22C55E", text: "#ffffff" },
  call:         { bg: "#60A5FA", text: "#ffffff" },
  personal:     { bg: "#A78BFA", text: "#ffffff" },
  other:        { bg: "#9CA3AF", text: "#ffffff" },
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting:      "Встреча",
  consultation: "Консультация",
  training:     "Тренировка",
  call:         "Звонок",
  personal:     "Личное",
  other:        "Другое",
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
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/calendar-utils.ts
git commit -m "feat: add calendar utilities (colors, labels, FC event converter, conflict detection)"
```

---

## Task 3: Events API Routes

**Files:**
- Create: `app/api/events/route.ts`
- Create: `app/api/events/[id]/route.ts`

- [ ] **Step 1: Create `app/api/events/route.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("events")
    .insert({
      workspace_id: profile.workspace_id,
      created_by: user.id,
      title: body.title,
      event_type: body.event_type ?? "meeting",
      status: body.status ?? "planned",
      start_at: body.start_at,
      end_at: body.end_at,
      all_day: body.all_day ?? false,
      description: body.description ?? null,
      location: body.location ?? null,
      notes: body.notes ?? null,
      contact_id: body.contact_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 2: Create `app/api/events/[id]/route.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updatePayload: Record<string, unknown> = {};
  const allowed = ["title", "event_type", "status", "start_at", "end_at", "all_day", "description", "location", "notes", "contact_id"] as const;
  for (const key of allowed) {
    if (key in body) updatePayload[key] = body[key];
  }

  const { data, error } = await supabase
    .from("events")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
```

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/events/
git commit -m "feat: add events API routes (list, create, update, delete)"
```

---

## Task 4: React Query Hooks

**Files:**
- Create: `hooks/use-events.ts`

- [ ] **Step 1: Create `hooks/use-events.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Event } from "@/types/database";

const EVENTS_KEY = ["events"] as const;

async function fetchEvents(): Promise<Event[]> {
  const res = await fetch("/api/events");
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export function useEvents() {
  return useQuery({ queryKey: EVENTS_KEY, queryFn: fetchEvents });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Event>) => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Event>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_KEY }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Event> & { id: string }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Event>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_KEY }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_KEY }),
  });
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/use-events.ts
git commit -m "feat: add React Query hooks for events CRUD"
```

---

## Task 5: Event Form Dialog

**Files:**
- Create: `components/calendar/event-dialog.tsx`

This is the create/edit modal. It uses react-hook-form + zod, shows conflict warnings.

- [ ] **Step 1: Create `components/calendar/event-dialog.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateEvent, useUpdateEvent } from "@/hooks/use-events";
import { detectConflicts, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from "@/lib/calendar-utils";
import type { Event, EventType, EventStatus } from "@/types/database";

const schema = z.object({
  title: z.string().min(1, "Название обязательно"),
  event_type: z.enum(["meeting", "consultation", "training", "call", "personal", "other"] as const),
  status: z.enum(["planned", "confirmed", "completed", "cancelled", "rescheduled"] as const),
  start_at: z.string().min(1, "Укажите дату начала"),
  end_at: z.string().min(1, "Укажите дату окончания"),
  all_day: z.boolean().default(false),
  description: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  defaultStart?: string;
  editEvent?: Event | null;
  allEvents: Event[];
}

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISOLocal(local: string) {
  return new Date(local).toISOString();
}

export function EventDialog({ open, onClose, defaultStart, editEvent, allEvents }: EventDialogProps) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const isEdit = !!editEvent;

  const defaultStartDT = defaultStart
    ? toLocalDatetime(defaultStart)
    : toLocalDatetime(new Date().toISOString());
  const defaultEndDT = defaultStart
    ? toLocalDatetime(new Date(new Date(defaultStart).getTime() + 60 * 60 * 1000).toISOString())
    : toLocalDatetime(new Date(Date.now() + 60 * 60 * 1000).toISOString());

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      event_type: "meeting",
      status: "planned",
      start_at: defaultStartDT,
      end_at: defaultEndDT,
      all_day: false,
    },
  });

  useEffect(() => {
    if (editEvent) {
      reset({
        title: editEvent.title,
        event_type: editEvent.event_type,
        status: editEvent.status,
        start_at: toLocalDatetime(editEvent.start_at),
        end_at: toLocalDatetime(editEvent.end_at),
        all_day: editEvent.all_day,
        description: editEvent.description ?? "",
        location: editEvent.location ?? "",
        notes: editEvent.notes ?? "",
      });
    } else {
      reset({
        title: "",
        event_type: "meeting",
        status: "planned",
        start_at: defaultStartDT,
        end_at: defaultEndDT,
        all_day: false,
        description: "",
        location: "",
        notes: "",
      });
    }
  }, [editEvent, open]);

  const watchStart = watch("start_at");
  const watchEnd = watch("end_at");
  const watchAllDay = watch("all_day");

  const conflicts = !watchAllDay && watchStart && watchEnd
    ? detectConflicts(allEvents, toISOLocal(watchStart), toISOLocal(watchEnd), editEvent?.id)
    : [];

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      start_at: toISOLocal(values.start_at),
      end_at: toISOLocal(values.end_at),
      description: values.description || null,
      location: values.location || null,
      notes: values.notes || null,
    };

    if (isEdit && editEvent) {
      await updateEvent.mutateAsync({ id: editEvent.id, ...payload });
    } else {
      await createEvent.mutateAsync(payload);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-[20px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-foreground">
            {isEdit ? "Редактировать событие" : "Новое событие"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {conflicts.length > 0 && (
            <div className="rounded-[12px] bg-accent/20 border border-accent/40 px-3 py-2 text-sm font-semibold text-foreground">
              ⚠ Конфликт с {conflicts.length} событием: {conflicts.map(c => c.title).join(", ")}
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-sm font-semibold">Название</Label>
            <Input {...register("title")} className="h-11 rounded-[12px]" placeholder="Название события" />
            {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Тип</Label>
              <Select
                defaultValue={editEvent?.event_type ?? "meeting"}
                onValueChange={(v) => setValue("event_type", v as EventType)}
              >
                <SelectTrigger className="h-11 rounded-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-semibold">Статус</Label>
              <Select
                defaultValue={editEvent?.status ?? "planned"}
                onValueChange={(v) => setValue("status", v as EventStatus)}
              >
                <SelectTrigger className="h-11 rounded-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(EVENT_STATUS_LABELS) as [EventStatus, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Начало</Label>
              <Input
                {...register("start_at")}
                type="datetime-local"
                disabled={watchAllDay}
                className="h-11 rounded-[12px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Конец</Label>
              <Input
                {...register("end_at")}
                type="datetime-local"
                disabled={watchAllDay}
                className="h-11 rounded-[12px]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("all_day")} className="rounded" />
            <span className="text-sm font-semibold">Весь день</span>
          </label>

          <div className="space-y-1">
            <Label className="text-sm font-semibold">Место</Label>
            <Input {...register("location")} className="h-11 rounded-[12px]" placeholder="Адрес или ссылка" />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-semibold">Описание</Label>
            <Textarea {...register("description")} className="rounded-[12px] resize-none" rows={2} placeholder="Описание..." />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-primary text-primary-foreground font-bold"
            >
              {isSubmitting ? "Сохраняем..." : isEdit ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/calendar/event-dialog.tsx
git commit -m "feat: add event create/edit dialog with conflict detection"
```

---

## Task 6: Event Popover (View on Click)

**Files:**
- Create: `components/calendar/event-popover.tsx`

- [ ] **Step 1: Create `components/calendar/event-popover.tsx`**

```typescript
"use client";

import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Edit2, Trash2 } from "lucide-react";
import { useDeleteEvent } from "@/hooks/use-events";
import {
  EVENT_COLORS, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS,
} from "@/lib/calendar-utils";
import type { Event } from "@/types/database";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface EventPopoverProps {
  event: Event | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onEdit: (event: Event) => void;
}

export function EventPopover({ event, anchorEl, onClose, onEdit }: EventPopoverProps) {
  const deleteEvent = useDeleteEvent();

  if (!event || !anchorEl) return null;

  async function handleDelete() {
    if (!event) return;
    if (!confirm(`Удалить событие "${event.title}"?`)) return;
    await deleteEvent.mutateAsync(event.id);
    onClose();
  }

  const colors = EVENT_COLORS[event.event_type];

  return (
    <Popover open onOpenChange={(v) => !v && onClose()}>
      <PopoverAnchor asChild>
        <span
          style={{
            position: "fixed",
            top: anchorEl.getBoundingClientRect().top,
            left: anchorEl.getBoundingClientRect().left,
            width: anchorEl.getBoundingClientRect().width,
            height: anchorEl.getBoundingClientRect().height,
            pointerEvents: "none",
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-72 rounded-[16px] shadow-card p-0 overflow-hidden"
        side="right"
        align="start"
        onInteractOutside={onClose}
      >
        <div
          className="px-4 py-3"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-base leading-tight">{event.title}</h3>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => { onEdit(event); onClose(); }}
                className="p-1 rounded-full hover:bg-black/10 transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 rounded-full hover:bg-black/10 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <p className="text-xs mt-1 opacity-80">
            {EVENT_TYPE_LABELS[event.event_type]}
          </p>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={14} className="flex-shrink-0" />
            <span className="font-semibold">
              {event.all_day
                ? format(new Date(event.start_at), "d MMMM yyyy", { locale: ru })
                : `${format(new Date(event.start_at), "d MMM, HH:mm", { locale: ru })} — ${format(new Date(event.end_at), "HH:mm", { locale: ru })}`}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="font-semibold">{event.location}</span>
            </div>
          )}

          {event.description && (
            <p className="text-sm text-foreground font-semibold">{event.description}</p>
          )}

          <Badge
            variant="secondary"
            className="rounded-full text-xs font-bold"
          >
            {EVENT_STATUS_LABELS[event.status]}
          </Badge>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Add `date-fns` locale import check**

`date-fns` is already installed. Verify `ru` locale exists:

```bash
node -e "require('date-fns/locale/ru'); console.log('ok')"
```

Expected: prints `ok`.

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/calendar/event-popover.tsx
git commit -m "feat: add event detail popover with edit/delete actions"
```

---

## Task 7: Calendar Filters

**Files:**
- Create: `components/calendar/calendar-filters.tsx`

- [ ] **Step 1: Create `components/calendar/calendar-filters.tsx`**

```typescript
"use client";

import { Badge } from "@/components/ui/badge";
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
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/calendar/calendar-filters.tsx
git commit -m "feat: add calendar event type filter chips"
```

---

## Task 8: FullCalendar View Component

**Files:**
- Create: `components/calendar/calendar-view.tsx`

This is the main FullCalendar wrapper. It handles all user interactions.

- [ ] **Step 1: Create `components/calendar/calendar-view.tsx`**

```typescript
"use client";

import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg } from "@fullcalendar/core";
import type { DateClickArg, EventDropArg, EventResizeDoneArg } from "@fullcalendar/interaction";
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
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If FullCalendar types complain about `EventResizeDoneArg`, import it from `@fullcalendar/interaction` instead:
```typescript
import type { DateClickArg, EventDropArg, EventResizeDoneArg } from "@fullcalendar/interaction";
```
and remove it from `@fullcalendar/core`.

- [ ] **Step 3: Commit**

```bash
git add components/calendar/calendar-view.tsx
git commit -m "feat: add FullCalendar view with all views, drag/drop, event filtering"
```

---

## Task 9: Calendar Page Assembly

**Files:**
- Modify: `app/(workspace)/calendar/page.tsx`

- [ ] **Step 1: Update `app/(workspace)/calendar/page.tsx`**

Replace the existing ComingSoon placeholder:

```typescript
import dynamic from "next/dynamic";

const CalendarView = dynamic(
  () => import("@/components/calendar/calendar-view").then((m) => m.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4">
        <div className="h-8 bg-muted rounded-full animate-pulse w-96" />
        <div className="h-[600px] bg-muted rounded-[20px] animate-pulse" />
      </div>
    ),
  }
);

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Календарь</h1>
        <p className="text-muted-foreground text-sm font-semibold mt-1">
          Все события и встречи
        </p>
      </div>
      <CalendarView />
    </div>
  );
}
```

- [ ] **Step 2: Type check + build**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

```bash
npm run build
```

Expected: Build succeeds. No errors.

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

Open http://localhost:3000/calendar and verify:
1. Calendar renders with Month view ✓
2. Click empty day → create dialog opens with correct date ✓
3. Fill title, click "Создать" → event appears on calendar ✓
4. Click event → popover shows event details ✓
5. Click edit icon in popover → edit dialog opens ✓
6. Drag event to different day → event moves ✓
7. Switch to Week/Day/List view → all work ✓
8. Toggle event type filters → calendar filters events ✓
9. Create two overlapping events → conflict warning shown ✓

- [ ] **Step 4: Commit**

```bash
git add app/(workspace)/calendar/page.tsx
git commit -m "feat: phase 2 complete — calendar with FullCalendar, CRUD, drag-drop, filters"
```

---

## Troubleshooting

**FullCalendar SSR error ("window is not defined"):** The page uses `dynamic(..., { ssr: false })` which prevents this. If the error appears, verify `CalendarView` is NOT imported directly (without dynamic) anywhere.

**`EventResizeDoneArg` not found in `@fullcalendar/core`:** Import from `@fullcalendar/interaction` instead — some FullCalendar versions export it there.

**Calendar looks unstyled:** FullCalendar v6 auto-injects its CSS. If styles are missing, add `import "@fullcalendar/common/main.css"` at the top of `calendar-view.tsx` (only needed for v5).

**Date-fns `ru` locale not found:** Run `npm install date-fns` to ensure v3 is installed. The `ru` locale is at `date-fns/locale/ru` in v3.

**Events not loading:** Check that `POST /api/setup-workspace` ran correctly during signup (workspace + profile exist). Open Supabase Dashboard → Table Editor → `profiles` to confirm.
