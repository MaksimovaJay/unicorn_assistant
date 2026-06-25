# Booking → Calendar Sync & Auto-Contacts Design

## Goal

Two independent features triggered by slot and participant actions:
1. **Синхронизация слот → календарь**: when an individual consultation slot is marked occupied, automatically create a calendar event; when freed, delete it.
2. **Авто-контакты**: when a participant's Telegram is saved, or a slot is filled with client_telegram, automatically add that person to Contacts (skip if already exists by telegram).

## Architecture

Both features hook into existing write paths with no new UI — all automation is invisible to the user.

**Slot → Calendar:** The slot PUT API route handles event creation/deletion server-side after the slot update succeeds. The slot stores `calendar_event_id` so it can delete the correct event later.

**Auto-contacts:** A new `POST /api/contacts` endpoint with dedup logic. Called client-side from the participant drawer after saving Telegram; called server-side (direct Supabase) from the slot PUT route after marking occupied.

**Tech Stack:** Next.js App Router, Supabase SSR, TanStack Query v5, TypeScript strict.

---

## Global Constraints

- All UI text in Russian
- No new npm dependencies
- TypeScript strict — no `any`, no `!` non-null assertions on nullable data
- API pattern: `await createClient()` → `getUser()` → `get_profile_for_user` RPC for workspace_id
- Errors in side-effect logic (calendar sync, contact creation) must NOT break the primary operation — log and continue
- Russian UI copy only

---

## Feature 1: Slot → Calendar Sync

### DB Migration (user runs manually in Supabase SQL Editor)

```sql
ALTER TABLE public.booking_slots
  ADD COLUMN IF NOT EXISTS calendar_event_id UUID REFERENCES events(id) ON DELETE SET NULL;
```

### File Structure

| File | Action |
|---|---|
| `types/database.ts` | Add `calendar_event_id: string \| null` to `BookingSlot` |
| `app/api/bookings/slots/[id]/route.ts` | Add sync logic after slot update |

### Type: `types/database.ts`

Add to `BookingSlot` interface after `notes`:
```typescript
calendar_event_id: string | null;
```

### API: `app/api/bookings/slots/[id]/route.ts`

Add `"calendar_event_id"` to the `allowed` array so it can be cleared.

After the existing `update().select().single()` returns `data`, add this block:

```typescript
// === Calendar sync ===
// Transition to occupied: create event if none exists
if (data.status === "occupied" && data.client_name && !data.calendar_event_id) {
  const { data: session } = await supabase
    .from("booking_sessions")
    .select("session_date, workspace_id")
    .eq("id", data.session_id)
    .single();

  if (session) {
    // slot_time may be "HH:MM" or "HH:MM:SS" — normalise to avoid double-suffix
    const timeStr = data.slot_time.length === 5 ? `${data.slot_time}:00` : data.slot_time;
    const startAt = new Date(`${session.session_date}T${timeStr}`);
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

    const { data: event } = await supabase.from("events").insert({
      workspace_id: session.workspace_id,
      title: `Консультация — ${data.client_name}`,
      event_type: "consultation",
      status: "confirmed",
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      all_day: false,
      created_by: user.id,
      ...(data.client_telegram ? { telegram: data.client_telegram } : {}),
    }).select().single();

    if (event) {
      await supabase.from("booking_slots")
        .update({ calendar_event_id: event.id })
        .eq("id", data.id);
      data.calendar_event_id = event.id;
    }
  }
}

// Transition to free: delete event if one exists
if (data.status === "free" && data.calendar_event_id) {
  await supabase.from("events").delete().eq("id", data.calendar_event_id);
  await supabase.from("booking_slots")
    .update({ calendar_event_id: null })
    .eq("id", data.id);
  data.calendar_event_id = null;
}
```

### Calendar Event Fields

| Field | Value |
|---|---|
| `title` | `"Консультация — {client_name}"` |
| `event_type` | `"consultation"` |
| `status` | `"confirmed"` |
| `start_at` | `{session_date}T{slot_time}` — slot_time normalised to HH:MM:SS |
| `end_at` | `start_at + 1 hour` |
| `all_day` | `false` |
| `telegram` | `client_telegram` (if set) |
| `workspace_id` | from `booking_sessions` |
| `created_by` | `user.id` |

### Edge Cases

- Client name changes while slot stays occupied → event title is NOT updated (acceptable)
- Calendar event manually deleted by user → `calendar_event_id` becomes stale; `ON DELETE SET NULL` on the FK clears it automatically
- `session_date` + `slot_time` timezone: stored as-is (local time string), matches how the app shows times everywhere else
- If event creation fails → slot update still returns successfully (error is swallowed after log)

---

## Feature 2: Auto-Contacts

### File Structure

| File | Action |
|---|---|
| `app/api/contacts/route.ts` | Create — POST endpoint with dedup |
| `hooks/use-contacts.ts` | Create — `useCreateContact()` mutation |
| `components/bookings/participant-drawer.tsx` | Call `useCreateContact()` after saving Telegram |
| `app/api/bookings/slots/[id]/route.ts` | Server-side contact creation when slot occupied |

### API: `POST /api/contacts`

New file `app/api/contacts/route.ts`:

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

  const body = await request.json();
  const { full_name, telegram, phone, email } = body as {
    full_name: string;
    telegram?: string;
    phone?: string;
    email?: string;
  };

  if (!full_name) return NextResponse.json({ error: "full_name required" }, { status: 400 });

  // Dedup by telegram
  if (telegram) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("workspace_id", profile.workspace_id)
      .eq("telegram", telegram)
      .maybeSingle();

    if (existing) return NextResponse.json(existing, { status: 200 });
  }

  const { data, error } = await supabase.from("contacts").insert({
    workspace_id: profile.workspace_id,
    full_name,
    telegram: telegram ?? null,
    phone: phone ?? null,
    email: email ?? null,
    favorite: false,
    created_by: user.id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

### Hook: `hooks/use-contacts.ts`

```typescript
"use client";

import { useMutation } from "@tanstack/react-query";

interface CreateContactInput {
  full_name: string;
  telegram?: string;
  phone?: string;
  email?: string;
}

async function createContact(input: CreateContactInput) {
  const res = await fetch("/api/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useCreateContact() {
  return useMutation({ mutationFn: createContact });
}
```

### Component: `components/bookings/participant-drawer.tsx`

Import `useCreateContact` and call after successful telegram save:

```typescript
const createContact = useCreateContact();

// Inside handleSave, after update.mutateAsync succeeds:
if (telegram.trim()) {
  createContact.mutate({
    full_name: p.full_name,
    telegram: telegram.trim(),
    phone: p.phone ?? undefined,
    email: p.email ?? undefined,
  });
  // fire-and-forget: errors don't block the save
}
```

### Slot API: `app/api/bookings/slots/[id]/route.ts`

In the same block where the calendar event is created (transition to occupied), also create a contact if `client_telegram` is set. This runs server-side, direct Supabase — no HTTP call:

```typescript
// After calendar event creation block, still inside the "occupied" branch:
if (data.client_telegram && session) {
  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("workspace_id", session.workspace_id)
    .eq("telegram", data.client_telegram)
    .maybeSingle();

  if (!existingContact) {
    await supabase.from("contacts").insert({
      workspace_id: session.workspace_id,
      full_name: data.client_name ?? data.client_telegram,
      telegram: data.client_telegram,
      phone: data.client_phone ?? null,
      favorite: false,
      created_by: user.id,
    });
  }
}
```

### Edge Cases

- Participant with no Telegram saved → no contact created (telegram required for dedup)
- Contact created, then user manually edits contact in Contacts section → no conflict; the auto-create just adds the record once
- Same person fills two different slots → second slot is a no-op (dedup by telegram)
- `full_name` is null on slot (shouldn't happen but) → fallback to `client_telegram` as name

---

## Data Flow

```
Slot PUT (status=occupied, client_name set):
  → update booking_slots
  → SELECT session_date, workspace_id FROM booking_sessions
  → INSERT INTO events → UPDATE booking_slots.calendar_event_id
  → (if client_telegram) check contacts → INSERT INTO contacts if new

Slot PUT (status=free, calendar_event_id set):
  → update booking_slots
  → DELETE FROM events WHERE id = calendar_event_id
  → UPDATE booking_slots.calendar_event_id = null

Participant drawer save (telegram set):
  → PUT /api/bookings/participants/[id] (existing)
  → POST /api/contacts (new, fire-and-forget)
```

---

## Out of Scope

- Updating calendar event title when client_name changes on an occupied slot
- Syncing group training sessions to calendar
- Editing contacts from within the booking UI
- Two-way sync (calendar changes reflected back to bookings)
- Notifications or reminders on created events
