# Dashboard — Today's Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ComingSoon placeholder on `/dashboard` with a real page showing today's events with type, time, and Telegram link.

**Architecture:** New `GET /api/dashboard` endpoint fetches today's events (UTC date range) from Supabase using the established `createClient → getUser → get_profile_for_user RPC` pattern. A `useTodayEvents()` hook wraps it. A `TodayEvents` client component renders the list with type-colored cards, loading skeleton, and empty state. The dashboard page is a simple server component composing the header and `TodayEvents`.

**Tech Stack:** Next.js 16 App Router, Supabase SSR (`@supabase/ssr`), TanStack Query v5, Tailwind CSS, lucide-react.

## Global Constraints

- All API routes use `await createClient()` from `@/lib/supabase/server` — never import supabase directly
- Auth pattern: `getUser()` → 401 if no user; `get_profile_for_user` RPC → 404 if no profile
- React Query: `staleTime: 30_000`, `refetchOnWindowFocus: false` — match all existing hooks
- No new npm dependencies
- Russian UI copy only
- TypeScript strict — no `any`, no `!` non-null assertions on data that can be null

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `app/api/dashboard/route.ts` | Create | Fetch today's events for the workspace |
| `hooks/use-dashboard.ts` | Create | `useTodayEvents()` React Query hook |
| `components/dashboard/today-events.tsx` | Create | Event list, card, skeleton, empty state |
| `app/(workspace)/dashboard/page.tsx` | Modify | Replace ComingSoon with header + TodayEvents |

---

### Task 1: API route + hook

**Files:**
- Create: `app/api/dashboard/route.ts`
- Create: `hooks/use-dashboard.ts`

**Interfaces:**
- Produces: `GET /api/dashboard` → `Event[]` (type from `@/types/database`)
- Produces: `useTodayEvents()` → `UseQueryResult<Event[]>`

- [ ] **Step 1: Create the API route**

Create `app/api/dashboard/route.ts` with this exact content:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.rpc("get_profile_for_user", { p_user_id: userId });
  return data?.[0] ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(supabase, user.id);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("workspace_id", profile.workspace_id)
    .gte("start_at", todayStart.toISOString())
    .lte("start_at", todayEnd.toISOString())
    .order("start_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Create the hook**

Create `hooks/use-dashboard.ts` with this exact content:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import type { Event } from "@/types/database";

async function fetchTodayEvents(): Promise<Event[]> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useTodayEvents() {
  return useQuery({
    queryKey: ["dashboard", "events"],
    queryFn: fetchTodayEvents,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: build succeeds, no type errors in the two new files. If it fails, fix type errors before continuing.

- [ ] **Step 4: Commit**

```bash
git add app/api/dashboard/route.ts hooks/use-dashboard.ts
git commit -m "feat: add dashboard API route and useTodayEvents hook"
```

---

### Task 2: TodayEvents component

**Files:**
- Create: `components/dashboard/today-events.tsx`

**Interfaces:**
- Consumes: `useTodayEvents()` from `@/hooks/use-dashboard` → `{ data: Event[], isLoading: boolean }`
- Consumes: `Event`, `EventType` from `@/types/database`
- Produces: `<TodayEvents />` — default export, no props

- [ ] **Step 1: Create the component**

Create `components/dashboard/today-events.tsx` with this exact content:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: no errors. If `bg-surface` or `text-text-primary` cause Tailwind warnings, that's fine — they are custom tokens used throughout the project.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/today-events.tsx
git commit -m "feat: add TodayEvents component with type cards and telegram link"
```

---

### Task 3: Dashboard page

**Files:**
- Modify: `app/(workspace)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `TodayEvents` from `@/components/dashboard/today-events`

Current content of `app/(workspace)/dashboard/page.tsx` (replace entirely):
```typescript
import { LayoutDashboard } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function DashboardPage() {
  return (
    <ComingSoon
      icon={LayoutDashboard}
      title="Dashboard"
      description="Обзор событий, задач и платежей на сегодня"
    />
  );
}
```

- [ ] **Step 1: Replace the page**

Replace the entire content of `app/(workspace)/dashboard/page.tsx` with:

```typescript
import { TodayEvents } from "@/components/dashboard/today-events";

function todayLabel(): string {
  const d = new Date();
  const date = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const weekday = d.toLocaleDateString("ru-RU", { weekday: "long" });
  return `${date}, ${weekday}`;
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-black text-text-primary">Сегодня</h1>
        <span className="text-sm text-muted-foreground capitalize">{todayLabel()}</span>
      </div>
      <TodayEvents />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build completes successfully, `/dashboard` appears in the route list as `ƒ` (dynamic, server-rendered on demand).

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`

Open `http://localhost:3000/dashboard`. Verify:
- Header shows "Сегодня" on the left and today's date + weekday on the right
- If no events today → centered empty state with calendar icon + "Событий на сегодня нет"
- If there are events → colored cards with type icon, label, time, title
- If an event has `telegram` set → Send icon appears, clicking it opens a new tab (does NOT navigate to /calendar)
- Clicking a card (not the telegram icon) → navigates to `/calendar`
- A cancelled event → card is 50% opacity, title has strikethrough

- [ ] **Step 4: Commit and push**

```bash
git add app/(workspace)/dashboard/page.tsx
git commit -m "feat: implement dashboard with today's events"
git push origin master
```
