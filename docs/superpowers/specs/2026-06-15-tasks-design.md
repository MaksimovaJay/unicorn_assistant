# Tasks Module — Design Specification
**Date:** 2026-06-15  
**Status:** Approved

---

## 1. Overview

Full-featured task management section for the Unicorn Assistant workspace. Replaces the current "Coming Soon" placeholder at `/tasks`. Two views: list (default) and kanban. View preference persisted in localStorage.

---

## 2. Data Model

Uses the existing `tasks` table (no schema changes needed):

```sql
tasks:
  id                uuid PK
  workspace_id      uuid FK
  title             text
  description       text (nullable)
  status            'new' | 'in_progress' | 'done'
  priority          'low' | 'medium' | 'high'
  deadline          timestamptz (nullable)
  assignee_id       uuid FK → profiles (nullable)
  related_event_id  uuid FK → events (nullable)
  related_contact_id uuid FK → contacts (nullable)
  created_by        uuid FK → profiles
  created_at        timestamptz
  updated_at        timestamptz
```

No new tables. No categories (YAGNI — priority + status + deadline cover filtering needs for a 2-person team).

---

## 3. API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks` | List all tasks for workspace |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/[id]` | Update any fields |
| DELETE | `/api/tasks/[id]` | Delete task (with confirm in UI) |

All routes: auth via cookies, workspace scoped via profile lookup.

---

## 4. UI Structure

### 4.1 Page Layout (`/tasks`)

```
┌─────────────────────────────┬──────────────────┐
│  LIST SIDE (flex: 1)        │  DRAWER (300px)  │
│                             │  (hidden if none  │
│  Header: title + controls   │   selected)       │
│  Tabs: filter bar           │                  │
│  ─────────────────────────  │  Task detail     │
│  Grouped task list          │  (edit in place) │
│  + Quick-add row            │                  │
└─────────────────────────────┴──────────────────┘
```

On mobile: drawer covers full width (sheet/overlay).

### 4.2 Filter Tabs

| Tab | Filter logic |
|-----|-------------|
| Все | All non-done tasks |
| Сегодня | deadline = today (any time) |
| Просроченные | deadline < today AND status ≠ done |
| Предстоящие | deadline > today |
| Завершённые | status = 'done' |

### 4.3 List Grouping (in "Все" tab)

Order: **Просрочено** → **Сегодня** → **Предстоящие** → **Без даты**

Each group has a label with emoji and a subtle divider line. Groups with 0 tasks are hidden.

### 4.4 Task Card (row in list)

```
[checkbox]  Title (truncated)
            [date badge] [priority badge] [status badge?]
```

- Clicking checkbox → marks done immediately (optimistic update)
- Clicking row body → opens drawer
- Active row highlighted with pink border + light bg

### 4.5 Quick Add

Dashed border row at bottom of list. Click → expands inline form:
- Text input (title, required)
- Date picker (optional)  
- Priority selector (optional, default: medium)
- Enter or "Добавить" button to save
- Escape to cancel

### 4.6 Drawer (task detail)

Slides in from right when a task is selected. Fields:

- **Title**: editable h2 input at top
- **Description**: textarea (markdown-lite, just plain text for now)
- **Status**: select (Новая / В работе / Завершена)
- **Priority**: select (🔥 Высокий / ⚡ Средний / 🌱 Низкий)
- **Deadline**: date+time picker
- **Assignee**: select from workspace profiles
- **Related event**: optional link to an event (select or clear)
- **Related contact**: optional link to a contact (select or clear)

Footer buttons:
- **✓ Завершить** — sets status=done, closes drawer (left side, green)
- **Удалить** — confirm dialog, then delete (red)
- **Сохранить** — saves all edits (pink, primary)

All field changes are saved only on "Сохранить" click (not auto-save on blur, to avoid partial saves when user is mid-edit).

### 4.7 Kanban View

Toggle button ⊞ in header. Preference saved to localStorage key `tasks-view`.

Three columns: **Новые** / **В работе** / **Готово**

Each column:
- Label + count
- Task cards (title + priority badge + deadline)
- "+" quick-add at bottom
- Drag & drop to move between columns (updates status via PATCH)

---

## 5. Components

```
app/(workspace)/tasks/page.tsx          — page shell, view toggle
components/tasks/
  tasks-list.tsx                        — list view with tabs + groups
  task-row.tsx                          — single row in list
  task-drawer.tsx                       — right-side detail panel
  task-quick-add.tsx                    — inline quick-add form
  tasks-kanban.tsx                      — kanban board
  kanban-column.tsx                     — single kanban column
hooks/
  use-tasks.ts                          — useTasks, useCreateTask, useUpdateTask, useDeleteTask
app/api/tasks/
  route.ts                              — GET + POST
  [id]/route.ts                         — PATCH + DELETE
```

---

## 6. Priority & Status Display

| Value | Label | Badge style |
|-------|-------|------------|
| high | 🔥 Высокий | red bg |
| medium | ⚡ Средний | yellow bg |
| low | 🌱 Низкий | green bg |
| new | Новая | purple bg |
| in_progress | В работе | blue bg |
| done | Готово | gray, strikethrough title |

---

## 7. Behaviour Details

- **Optimistic checkbox**: clicking the row checkbox immediately strikes through the title and updates locally; PATCH fires in background
- **Drawer close**: click outside list area, press Escape, or click same task again
- **Delete confirmation**: `confirm("Удалить задачу «[title]»?")` — same pattern as rest of app
- **Empty states**: each tab shows an icon + message + "Создать задачу" button when empty
- **Overdue badge**: deadline < now shows date in red regardless of tab

---

## 8. Out of Scope (v1)

- Repeating tasks
- Tags / categories
- File attachments on tasks
- Comments / activity on tasks
- AI assistant block
- Drag & drop reordering within list view

These can be added in v2 without architectural changes.
