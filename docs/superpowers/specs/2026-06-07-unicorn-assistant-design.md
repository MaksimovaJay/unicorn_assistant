# Unicorn Assistant — Design Specification
**Version:** 1.0  
**Date:** 2026-06-07  
**Status:** Approved

---

## 1. Project Overview

Internal web workspace for a small team of 2 people. Replaces scattered information across Telegram, WhatsApp, notes, and spreadsheets. Single source of truth for schedule, tasks, contacts, payments, files, and notes.

**Not** a public CRM, booking platform, or client-facing tool. Private internal system.

---

## 2. Users & Roles

| User | Role | Access |
|------|------|--------|
| Евгения (creator) | Owner | Full access — create, edit, delete, manage workspace |
| Ярослава | Owner | Full access — create, edit, delete, manage workspace |

Both users have identical permissions. Activity log tracks who did what.

Role system (Manager / Assistant) is scaffolded for future use if a 3rd person with limited access is added.

---

## 3. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript |
| Styling | TailwindCSS, Shadcn UI |
| Data fetching | React Query (TanStack Query) |
| Forms | React Hook Form + Zod |
| Calendar | FullCalendar |
| Backend | Supabase (Auth + PostgreSQL + Storage + Realtime) |

**Supabase project:**
- URL: `https://oktruadycdbnkxtifugw.supabase.co`
- Region: Northeast Asia (Tokyo)

---

## 4. Design System

### Colors
```
Primary (Pink):     #F996A5  — buttons, active states, links
Accent (Yellow):    #FABE3E  — warnings, important labels
Background:         #FEF3F3
Surface:            #FFFFFF
Border:             #F0DCDC
Text Primary:       #2D2020
Text Secondary:     #5A3D3D
Success:            #22C55E
Warning:            #FABE3E
Danger:             #EF4444
```

### Typography
```
Font: Nunito
Page Title:    40px / 900
Section Title: 28px / 800
Card Title:    18px / 800
Body:          14px / 600
Caption:       12px / 600
```

### Border Radius
```
Small:   12px
Medium:  20px
Large:   32px
Buttons: 999px
```

### Shadows
```
Soft only: 0 4px 24px rgba(0,0,0,0.08)
No hard shadows.
```

### Spacing
8px system: 8 / 16 / 24 / 32 / 40 / 48 / 64

### Cards
```css
background: #FFFFFF;
border-radius: 20px;
padding: 24px;
box-shadow: 0 4px 24px rgba(0,0,0,0.08);
```

### Buttons
- Primary: pink background, 44px height, 999px radius
- Secondary: white with border
- Ghost: no background, text only

### Inputs
- Height: 44px
- Radius: 12px
- Focus: pink border

### Animations
- Duration: 150ms–250ms
- Allowed: hover, fade, scale, slide
- Forbidden: bounce, shake, flash, rotation

---

## 5. Application Layout

```
┌──────────────────────────────────────────┐
│ Topbar (72px)  Search | Notifications | Me│
├──────────────┬───────────────────────────┤
│ Sidebar      │ Page Content              │
│ (280px)      │                           │
│              │                           │
│ Logo         │                           │
│ Dashboard    │                           │
│ Calendar     │                           │
│ Tasks        │                           │
│ Contacts     │                           │
│ Bookings     │                           │
│ Payments     │                           │
│ Notes        │                           │
│ Files        │                           │
│ Activity     │                           │
│ Settings     │                           │
└──────────────┴───────────────────────────┘
```

**Responsive:**
- Desktop → sidebar fixed 280px
- Tablet → sidebar collapsible
- Mobile → sidebar as drawer

---

## 6. Database Schema

### `workspaces`
```sql
id            uuid PK
name          text
timezone      text default 'Asia/Tokyo'
currency      text default 'RUB'
created_at    timestamptz
```

### `profiles`
Extends Supabase Auth users with workspace data:
```sql
id            uuid PK (references auth.users)
workspace_id  uuid FK → workspaces
full_name     text
avatar_url    text
role          text ('owner' | 'manager' | 'assistant')
created_at    timestamptz
```

### `events`
```sql
id              uuid PK
workspace_id    uuid FK
title           text
description     text
start_at        timestamptz
end_at          timestamptz
all_day         boolean default false
event_type      text ('meeting'|'consultation'|'training'|'call'|'personal'|'other')
status          text ('planned'|'confirmed'|'completed'|'cancelled'|'rescheduled')
location        text
meeting_link    text
notes           text
contact_id      uuid FK → contacts (nullable)
created_by      uuid FK → profiles
created_at      timestamptz
updated_at      timestamptz
```

### `tasks`
```sql
id                uuid PK
workspace_id      uuid FK
title             text
description       text
status            text ('new'|'in_progress'|'done')
priority          text ('low'|'medium'|'high')
deadline          date
assignee_id       uuid FK → profiles (nullable)
related_event_id  uuid FK → events (nullable)
related_contact_id uuid FK → contacts (nullable)
created_by        uuid FK → profiles
created_at        timestamptz
updated_at        timestamptz
```

### `contacts`
```sql
id            uuid PK
workspace_id  uuid FK
full_name     text
phone         text
telegram      text
email         text
notes         text
favorite      boolean default false
created_at    timestamptz
updated_at    timestamptz
```

### `booking_sessions`
```sql
id            uuid PK
workspace_id  uuid FK
title         text        -- "Консультации · Июнь 2026"
session_date  date
created_by    uuid FK → profiles
created_at    timestamptz
```

### `booking_slots`
```sql
id                uuid PK
session_id        uuid FK → booking_sessions
slot_time         time
status            text ('free'|'occupied')
client_name       text (nullable)
client_phone      text (nullable)
client_telegram   text (nullable)
notes             text (nullable)
created_at        timestamptz
updated_at        timestamptz
```

### `payments`
```sql
id            uuid PK
workspace_id  uuid FK
title         text
amount        numeric
currency      text default 'RUB'
type          text ('one_time'|'recurring')
status        text ('paid'|'unpaid'|'overdue')
due_date      date
notes         text
created_at    timestamptz
updated_at    timestamptz
```

### `payment_history`
```sql
id              uuid PK
payment_id      uuid FK → payments
month           int  (1–12)
year            int
status          text ('paid'|'unpaid')
paid_date       date (nullable)
receipt_file_id uuid FK → files (nullable)
created_at      timestamptz
```

### `notes`
```sql
id            uuid PK
workspace_id  uuid FK
title         text
content       text  -- markdown
tags          text[]
pinned        boolean default false
archived      boolean default false
created_by    uuid FK → profiles
created_at    timestamptz
updated_at    timestamptz
```

### `files`
```sql
id              uuid PK
workspace_id    uuid FK
name            text
size            bigint
mime_type       text
storage_path    text  -- Supabase Storage path
entity_type     text  ('event'|'task'|'contact'|'payment'|'note'|'booking_slot')
entity_id       uuid
uploaded_by     uuid FK → profiles
created_at      timestamptz
```

### `notifications`
```sql
id            uuid PK
workspace_id  uuid FK
user_id       uuid FK → profiles
type          text ('upcoming_event'|'overdue_task'|'payment_reminder'|'conflict')
title         text
body          text
read          boolean default false
entity_type   text (nullable)
entity_id     uuid (nullable)
created_at    timestamptz
```

### `activity_logs`
```sql
id            uuid PK
workspace_id  uuid FK
user_id       uuid FK → profiles
action        text ('created'|'updated'|'deleted'|'uploaded'|'status_changed')
entity_type   text
entity_id     uuid
entity_title  text
metadata      jsonb
created_at    timestamptz
```

---

## 7. Modules

### Dashboard
- Today's events (by time)
- Upcoming events (next 7 days)
- Open tasks with deadlines
- Overdue tasks
- Payments requiring attention
- Recent activity feed

### Calendar
- Views: Day / Week / Month / Year
- Event types with unique colors
- Create by clicking empty space
- Click event → popover with details
- Drag & Drop to reschedule
- Conflict detection (warning, not blocking)
- Recurring events
- Filter by type/status

### Tasks
- List view (sortable by priority/deadline)
- Kanban: New → In Progress → Done (drag & drop)
- Task card: title, priority badge, deadline, assignee
- Task detail: full description, linked contact/event, files, comments

### Contacts
- Card grid with name, phone, telegram
- Favorite contacts pinned at top
- Contact detail:
  - Left: main info + notes
  - Right tabs: Events / Tasks / Files / Payments

### Bookings ("Записи")
> Distinct from Calendar: Calendar events are general schedule entries. Bookings are structured consultation sessions with managed time slots and client data.

- Create a session: "Запись на консультацию · Июнь 2026" + date
- Add time slots manually (e.g. 9:30, 11:00, 13:00, 14:30)
- Slots display as cards:
  - Pink card = free ("СВОБОДНО")
  - Gray card with strikethrough = occupied ("ЗАНЯТО")
- Click occupied slot → view/edit client details: ФИО, Phone, Telegram, Notes
- Monthly sessions, typically 4 slots per session

### Payments
- Cards for one-time payments
- Recurring payments: table grid (rows = payment name, columns = months)
  - Each cell: ✅ paid / ❌ unpaid
  - Click cell → mark paid/unpaid, attach receipt
- Status badges: Paid / Unpaid / Overdue

### Notes
- Markdown editor (bold, italic, lists, checklists, links)
- Tags for filtering
- Pin note to top
- Archive note

### Files
- Card grid: icon by file type, name, size, date
- Upload via drag & drop or button
- Linked to entity (shown as "Договор с Аней → Contact: Аня")
- Preview for images/PDF
- Download button

### Global Search
- Search across: Events, Tasks, Contacts, Payments, Notes, Files
- Results grouped by type
- Keyboard shortcut: Cmd/Ctrl+K

### Activity Log
- Full history: who / what / when
- Filter by user / entity type / date
- Example: "Евгения создала событие «Встреча» · 5 июня 10:32"

### Notifications
- Bell icon in topbar with unread count
- Types: upcoming event, overdue task, payment reminder, schedule conflict
- Mark read / mark all read

### Settings
- Workspace: name, timezone, currency
- Members: invite by email, change role, remove
- Profile: name, avatar, email, password
- Appearance: dark mode toggle

---

## 8. Development Phases

| Phase | Module | Key Deliverable |
|-------|--------|-----------------|
| **1** | Foundation | Next.js setup, all DB tables + RLS, Supabase Auth, App Layout, Design System tokens |
| **2** | Calendar | FullCalendar, all views, CRUD events, conflict detection |
| **3** | Tasks | List + Kanban, CRUD tasks, drag & drop |
| **4** | Contacts | Contact list + detail page, favorites |
| **5** | Bookings | Session + slot management, free/occupied UI |
| **6** | Payments | Cards + recurring grid, payment history, receipts |
| **7** | Notes | Markdown editor, tags, pin/archive |
| **8** | Files | Supabase Storage upload, card grid, entity linking |
| **9** | Search + Activity + Notifications | Global search, activity log, notification bell |
| **10** | Dashboard + Settings + Polish | Final dashboard, settings, empty/loading/error states, responsive |

---

## 9. Security

- Supabase RLS on all tables: every query filtered by `workspace_id`
- Users can only access their own workspace data
- `sb_publishable` key used in frontend only
- `sb_secret` key used in server-side only (never in client code)
- Auth via Supabase Auth (email + password)

---

## 10. Non-functional Requirements

- Desktop First, responsive down to mobile
- Initial load < 2 seconds
- Search results < 500ms
- Calendar smooth with 5000+ events
- Skeleton loaders (no full-screen spinner)
- All forms: validation + error messages
- Every section: proper empty state with icon + action button
- Browsers: Chrome, Safari, Firefox, Edge

---

## 11. Future (v2, not in scope)

- Apple iOS app via React Native or Capacitor
- Push notifications via APNS
- Telegram Bot integration
- AI assistant
- Online payments
- Google Calendar sync
- Client-facing booking page
