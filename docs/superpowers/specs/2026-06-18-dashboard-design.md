# Dashboard — Today's Events Design

## Goal

Replace the ComingSoon placeholder on `/dashboard` with a real page showing today's events, so the user can quickly see what's happening today and jump to Telegram chats from event cards.

## Architecture

**API:** `GET /api/dashboard` — new endpoint. Fetches events where `start_at::date = CURRENT_DATE` for the user's workspace, ordered by `start_at ASC`. Returns the raw event array. Uses the same `createClient` + `getUser` + `get_profile_for_user` RPC pattern as all other workspace API routes.

**Hook:** `useTodayEvents()` in `hooks/use-dashboard.ts` (new file). Standard TanStack Query pattern: `queryKey: ["dashboard", "events"]`, `staleTime: 30_000`, `refetchOnWindowFocus: false`.

**Components:**
- `components/dashboard/today-events.tsx` — list, card, loading skeleton, empty state
- `app/(workspace)/dashboard/page.tsx` — page header + `TodayEvents`

## File Structure

| File | Action |
|---|---|
| `app/api/dashboard/route.ts` | Create |
| `hooks/use-dashboard.ts` | Create |
| `components/dashboard/today-events.tsx` | Create |
| `app/(workspace)/dashboard/page.tsx` | Modify (replace ComingSoon) |

## Page Layout

Standard workspace layout (no full-bleed `-m-6`). Normal padding from parent `<main>`.

Header row:
- Left: `h1` "Сегодня" (`text-2xl font-black text-text-primary`)
- Right: current date formatted as `"18 июня, вторник"` (`text-sm text-muted-foreground`)

Below header: `<TodayEvents />` component.

## Event Card

Each event renders as a card with:

```
┌─ [COLOR STRIPE] ──────────────────────────────┐
│  [TYPE ICON] [type label]    [HH:MM]   [TG]   │
│  [Event title — bold]                          │
└───────────────────────────────────────────────┘
```

- **Color stripe**: 4px left border, color by `event_type`
- **Type label + icon**: small muted text (`text-xs text-muted-foreground`)
- **Time**: `start_at` formatted as `HH:MM`, right-aligned, `text-sm font-semibold`
- **Telegram icon** (`Send` from lucide-react): shown only if `event.telegram` is non-null; `<a href={event.telegram} target="_blank" rel="noopener noreferrer">` — stops click propagation so it doesn't navigate to calendar
- **Title**: `text-sm font-bold text-text-primary`
- **Whole card click**: `router.push('/calendar')`

### Event type config

| type | icon | label | stripe color |
|---|---|---|---|
| call | 📞 | Звонок | `border-blue-400` |
| consultation | 💬 | Консультация | `border-indigo-400` |
| training | 🏋️ | Тренинг | `border-green-400` |
| meeting | 🤝 | Встреча | `border-purple-400` |
| personal | ⭐ | Личное | `border-amber-400` |
| other | 📌 | Другое | `border-gray-400` |

## Loading State

3 skeleton cards: `h-16 bg-muted animate-pulse rounded-xl` (matches tasks-list pattern).

## Empty State

`CalendarDays` icon (lucide) centered + `"Событий на сегодня нет"` — matches style of other sections.

## Data Flow

```
dashboard/page.tsx
  → <TodayEvents />
    → useTodayEvents()
      → GET /api/dashboard
        → createClient()
        → getUser()
        → get_profile_for_user RPC → workspace_id
        → SELECT * FROM events
            WHERE workspace_id = $1
              AND start_at::date = CURRENT_DATE
            ORDER BY start_at ASC
```

## Edge Cases

- `all_day` events have no meaningful time → show "Весь день" instead of HH:MM
- `status = 'cancelled'` events: still show but with muted opacity (`opacity-50`) and strikethrough on title
- No events today → empty state

## Out of Scope

- Tasks, payments, bookings on dashboard (future)
- Contact name display (contacts feature not in active use)
- Navigation to individual event detail (calendar handles this)
