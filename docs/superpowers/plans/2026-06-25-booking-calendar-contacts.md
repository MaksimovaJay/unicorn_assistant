# Booking → Calendar Sync & Auto-Contacts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a consultation slot is marked occupied, automatically create a calendar event (1 hour, "Консультация — [client]"); when freed, delete it; when a participant's Telegram or a slot's client_telegram is saved, automatically create a Contact (skip if telegram already exists).

**Architecture:** All logic lives server-side in API routes — no new UI. Slot sync + auto-contact happen in `PUT /api/bookings/slots/[id]`. Participant auto-contact fires client-side from the drawer via a new `POST /api/contacts` endpoint + `useCreateContact()` hook.

**Tech Stack:** Next.js App Router, Supabase SSR (`@supabase/ssr`), TanStack Query v5, TypeScript strict.

## ⚠️ DB Migration — Run First

Before implementing anything, the user must run this in the Supabase SQL Editor:

```sql
ALTER TABLE public.booking_slots
  ADD COLUMN IF NOT EXISTS calendar_event_id UUID REFERENCES events(id) ON DELETE SET NULL;
```

## Global Constraints

- All UI text in Russian
- No new npm dependencies
- TypeScript strict — no `any`, no `!` non-null assertions on nullable data
- API pattern: `await createClient()` → `getUser()` → `get_profile_for_user` RPC for workspace_id
- Errors in side-effect logic (calendar sync, contact creation) must NOT break the primary operation — wrap in try/catch, log, continue
- `staleTime: 60_000`, `refetchOnWindowFocus: false` in all React Query hooks

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `app/api/contacts/route.ts` | Create | POST endpoint — create contact with telegram dedup |
| `hooks/use-contacts.ts` | Create | `useCreateContact()` TanStack mutation |
| `components/bookings/participant-drawer.tsx` | Modify | Call `useCreateContact()` fire-and-forget after saving telegram |
| `types/database.ts` | Modify | Add `calendar_event_id: string \| null` to `BookingSlot` |
| `app/api/bookings/slots/[id]/route.ts` | Modify | Calendar sync + server-side auto-contact on slot update |

---

### Task 1: POST /api/contacts + useCreateContact hook

**Files:**
- Create: `app/api/contacts/route.ts`
- Create: `hooks/use-contacts.ts`

**Interfaces:**
- Produces: `POST /api/contacts` → accepts `{ full_name: string, telegram?: string, phone?: string, email?: string }`, returns `Contact` (200 if existing, 201 if created)
- Produces: `useCreateContact()` → `UseMutationResult<Contact, Error, CreateContactInput>`

No test suite exists in this project. Use `npm run build` as the TypeScript verification step.

- [ ] **Step 1: Create `app/api/contacts/route.ts`**

The file must not exist yet — `app/api/contacts/[id]/route.ts` exists (GET by id) but `app/api/contacts/route.ts` (collection route) does not. Create it with this exact content:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.rpc("get_profile_for_user", { p_user_id: userId });
  return data?.[0] ?? null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(supabase, user.id);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await request.json() as {
    full_name: string;
    telegram?: string;
    phone?: string;
    email?: string;
  };

  if (!body.full_name) {
    return NextResponse.json({ error: "full_name required" }, { status: 400 });
  }

  // Dedup by telegram — return existing contact without creating a duplicate
  if (body.telegram) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .eq("telegram", body.telegram)
      .maybeSingle();

    if (existing) return NextResponse.json(existing, { status: 200 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      workspace_id: profile.workspace_id,
      full_name: body.full_name,
      telegram: body.telegram ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      favorite: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 2: Create `hooks/use-contacts.ts`**

Create this file:

```typescript
"use client";

import { useMutation } from "@tanstack/react-query";

interface CreateContactInput {
  full_name: string;
  telegram?: string;
  phone?: string;
  email?: string;
}

async function createContactFn(input: CreateContactInput): Promise<unknown> {
  const res = await fetch("/api/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useCreateContact() {
  return useMutation({ mutationFn: createContactFn });
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npm run build`
Expected: build succeeds, no errors in the two new files. If TypeScript complains about the Supabase `contacts` insert, check that `workspace_id` is a valid field on the contacts Insert type in `types/database.ts`.

- [ ] **Step 4: Commit**

```bash
git add app/api/contacts/route.ts hooks/use-contacts.ts
git commit -m "feat: add POST /api/contacts with telegram dedup and useCreateContact hook"
```

---

### Task 2: Participant drawer — auto-contact on telegram save

**Files:**
- Modify: `components/bookings/participant-drawer.tsx`

**Interfaces:**
- Consumes: `useCreateContact()` from `@/hooks/use-contacts` (Task 1)

Current `handleSave` (lines 45-48):
```typescript
async function handleSave() {
  const result = await update.mutateAsync({ id: p.id, telegram: telegram.trim() || null });
  onUpdate(result);
}
```

The change: after `onUpdate(result)`, fire `createContact.mutate(...)` if telegram is set. This is fire-and-forget — errors from contact creation must NOT surface to the user or block the save flow.

- [ ] **Step 1: Add import**

In `components/bookings/participant-drawer.tsx`, add to the existing import block (after the last import):

```typescript
import { useCreateContact } from "@/hooks/use-contacts";
```

- [ ] **Step 2: Add hook instance**

Inside `ParticipantDrawer` component, after the existing `const uploadReceipt = useUploadReceipt(groupId);` line, add:

```typescript
const createContact = useCreateContact();
```

- [ ] **Step 3: Update handleSave**

Replace the existing `handleSave` function (lines 45–48):

```typescript
async function handleSave() {
  const result = await update.mutateAsync({ id: p.id, telegram: telegram.trim() || null });
  onUpdate(result);
  // Fire-and-forget: auto-add to contacts when telegram is saved
  if (telegram.trim()) {
    createContact.mutate({
      full_name: p.full_name,
      telegram: telegram.trim(),
      ...(p.phone ? { phone: p.phone } : {}),
      ...(p.email ? { email: p.email } : {}),
    });
  }
}
```

- [ ] **Step 4: Verify TypeScript**

Run: `npm run build`
Expected: build succeeds with no new errors.

- [ ] **Step 5: Commit**

```bash
git add components/bookings/participant-drawer.tsx
git commit -m "feat: auto-create contact when participant telegram is saved"
```

---

### Task 3: Types + Slot API — calendar sync + auto-contact

**Files:**
- Modify: `types/database.ts`
- Modify: `app/api/bookings/slots/[id]/route.ts`

**Interfaces:**
- Consumes: `BookingSlot.calendar_event_id` added in this task
- Produces: updated `PUT /api/bookings/slots/[id]` — creates/deletes calendar events and contacts server-side

**Context:** The slot PUT route is at `app/api/bookings/slots/[id]/route.ts`. Current content:
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowed = ["slot_time", "status", "client_name", "client_phone", "client_telegram", "notes"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase.from("booking_slots").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("booking_slots").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
```

- [ ] **Step 1: Add `calendar_event_id` to BookingSlot type**

In `types/database.ts`, find the `BookingSlot` interface (around line 96). It currently ends with `notes: string | null;`. Add `calendar_event_id` after `notes`:

Before:
```typescript
export interface BookingSlot {
  id: string;
  session_id: string;
  slot_time: string;
  status: BookingSlotStatus;
  client_name: string | null;
  client_phone: string | null;
  client_telegram: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

After:
```typescript
export interface BookingSlot {
  id: string;
  session_id: string;
  slot_time: string;
  status: BookingSlotStatus;
  client_name: string | null;
  client_phone: string | null;
  client_telegram: string | null;
  notes: string | null;
  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Replace the slot PUT route with sync logic**

Replace the entire content of `app/api/bookings/slots/[id]/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowed = ["slot_time", "status", "client_name", "client_phone", "client_telegram", "notes"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("booking_slots")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Calendar sync + auto-contact when slot becomes occupied
  if (data.status === "occupied" && data.client_name && !data.calendar_event_id) {
    try {
      const { data: session } = await supabase
        .from("booking_sessions")
        .select("session_date, workspace_id")
        .eq("id", data.session_id)
        .single();

      if (session) {
        // slot_time from Supabase is "HH:MM:SS"; may be "HH:MM" — normalise
        const timeStr = data.slot_time.length === 5
          ? `${data.slot_time}:00`
          : data.slot_time;
        const startAt = new Date(`${session.session_date}T${timeStr}`);
        const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

        const { data: event } = await supabase
          .from("events")
          .insert({
            workspace_id: session.workspace_id,
            title: `Консультация — ${data.client_name}`,
            event_type: "consultation",
            status: "confirmed",
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
            all_day: false,
            created_by: user.id,
            ...(data.client_telegram ? { telegram: data.client_telegram } : {}),
          })
          .select("id")
          .single();

        if (event) {
          await supabase
            .from("booking_slots")
            .update({ calendar_event_id: event.id })
            .eq("id", data.id);
        }

        // Auto-contact when client has a telegram
        if (data.client_telegram) {
          const { data: existing } = await supabase
            .from("contacts")
            .select("id")
            .eq("workspace_id", session.workspace_id)
            .eq("telegram", data.client_telegram)
            .maybeSingle();

          if (!existing) {
            await supabase.from("contacts").insert({
              workspace_id: session.workspace_id,
              full_name: data.client_name,
              telegram: data.client_telegram,
              phone: data.client_phone ?? null,
              favorite: false,
            });
          }
        }
      }
    } catch (e) {
      console.error("[slot sync] calendar/contact error:", e);
    }
  }

  // Calendar sync when slot becomes free — delete the linked event
  if (data.status === "free" && data.calendar_event_id) {
    try {
      await supabase.from("events").delete().eq("id", data.calendar_event_id);
      await supabase
        .from("booking_slots")
        .update({ calendar_event_id: null })
        .eq("id", data.id);
    } catch (e) {
      console.error("[slot sync] delete event error:", e);
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("booking_slots").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npm run build`
Expected: build succeeds with no new errors. If TypeScript complains about `data.slot_time.length` or `data.calendar_event_id` being `unknown`, check that `BookingSlot` now includes `calendar_event_id: string | null` and `slot_time: string`.

- [ ] **Step 4: Manual verification in browser**

Run: `npm run dev`

**Test calendar sync:**
1. Open a booking session with slots — go to the Slots tab
2. Fill a slot with a client name (and optionally Telegram)
3. Save the slot
4. Open the Calendar section — verify a new "Консультация — [name]" event appeared at the correct time on the correct date
5. Go back to the slot, clear the client name / set status to free
6. Check Calendar — verify the event is gone

**Test auto-contact from slot:**
1. Fill a slot with client_name + client_telegram (e.g. "@testuser")
2. Check Contacts — verify a new contact was created with that name and telegram
3. Fill another slot with the same telegram — check Contacts: only ONE contact, not two

**Test auto-contact from participant drawer:**
1. Open a booking session → Participants tab
2. Click the Info icon on a participant
3. Enter a Telegram handle in the drawer and click Сохранить
4. Check Contacts — verify the participant was added

- [ ] **Step 5: Commit**

```bash
git add types/database.ts app/api/bookings/slots/[id]/route.ts
git commit -m "feat: slot-to-calendar sync and auto-contact on slot occupation"
```
