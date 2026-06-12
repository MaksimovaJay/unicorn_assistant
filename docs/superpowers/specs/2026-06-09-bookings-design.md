# Bookings Section Design

## Goal

Build a full bookings management section: list of events (мероприятия), each with a time slots view and a participants table view.

## Page structure

### /bookings — Events list
- Cards: event name + date
- Button "Создать мероприятие" → dialog: Название (text), Дата (date)
- Click card → opens event detail page /bookings/[id]

### /bookings/[id] — Event detail
Two tabs: **Слоты** and **Участники**

---

## Tab 1: Слоты

- 2×2 grid of 4 time slot tiles
- Each tile shows: time (HH:MM) + status badge (ЗАНЯТО / СВОБОДНО) + @telegram (if occupied)
- Click tile → edit popover: change time, toggle status, enter @telegram
- Free slot = pink highlight; Occupied = gray/muted
- Telegram icon on occupied tile → opens t.me/username in new tab

## Tab 2: Участники

- User creates named groups per event (e.g. "Очный", "Онлайн", "VIP")
- Button "+ Добавить группу" → dialog: group name
- Each group shows a table of participants
- Button "+ Участник" per group → inline row or dialog
- Columns per participant:
  - ФИО (text)
  - Email (text)
  - Телефон (text)
  - Оплачено (select: Оплачено / Не оплачено)
  - Забронировано (select: Да / Нет)
  - Дата оплаты (date)
  - Где общались (select: Telegram / WhatsApp / Другое)
  - Чек (file upload → Supabase Storage, shows download link when uploaded)
- Delete row button per participant

---

## Database

### Existing tables (already in Supabase)
- `booking_sessions`: id, workspace_id, title, session_date, created_by, created_at
- `booking_slots`: id, session_id, slot_time, status (free/occupied), client_name, client_phone, client_telegram, notes, created_at, updated_at

### New tables needed

```sql
-- Groups per event
create table booking_groups (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references booking_sessions(id) on delete cascade not null,
  name text not null,
  position int default 0,
  created_at timestamptz default now()
);

-- Participants per group
create table booking_participants (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references booking_groups(id) on delete cascade not null,
  full_name text not null,
  email text,
  phone text,
  payment_status text default 'unpaid', -- paid | unpaid
  booked boolean default false,
  payment_date date,
  contact_channel text, -- telegram | whatsapp | other
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### RLS
Both tables: workspace members can manage via session ownership check.

### Storage
Supabase Storage bucket `receipts` — public read, authenticated write.

---

## API routes

- `GET/POST /api/bookings/sessions` — list/create sessions
- `DELETE /api/bookings/sessions/[id]` — delete session
- `GET/POST /api/bookings/sessions/[id]/slots` — list/create slots
- `PUT/DELETE /api/bookings/slots/[id]` — update/delete slot
- `GET/POST /api/bookings/sessions/[id]/groups` — list/create groups
- `DELETE /api/bookings/groups/[id]` — delete group
- `GET/POST /api/bookings/groups/[id]/participants` — list/create participants
- `PUT/DELETE /api/bookings/participants/[id]` — update/delete participant
- `POST /api/bookings/participants/[id]/receipt` — upload receipt to Supabase Storage

## Components

- `components/bookings/sessions-list.tsx` — cards grid
- `components/bookings/session-dialog.tsx` — create session
- `components/bookings/slots-tab.tsx` — 2×2 slot tiles
- `components/bookings/slot-tile.tsx` — single tile + edit popover
- `components/bookings/participants-tab.tsx` — groups + tables
- `components/bookings/group-table.tsx` — participants table per group
- `components/bookings/participant-row.tsx` — editable row
- `hooks/use-bookings.ts` — all React Query hooks
