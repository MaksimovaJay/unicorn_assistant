# Participant Drawer & InlineEdit Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix accidental inline editing triggered by any click on text titles, and add a participant detail drawer in the Bookings section with editable Telegram link, clickable phone/email, and receipt access.

**Architecture:** `InlineEdit` is modified to show a pencil-button on hover instead of activating on text click — one change, all uses update automatically. The session card in `SessionsList` becomes a full `<Link>`. The participant drawer (`ParticipantDrawer`) is modeled on `TaskDrawer`: 300px panel rendered as a flex sibling inside `ParticipantsTab`, opened via an `Info` icon button added as the first cell in each `ParticipantRow`. A new `telegram TEXT NULL` column is added to `booking_participants` (user runs SQL migration in Supabase).

**Tech Stack:** Next.js App Router, Supabase, TanStack Query v5, Tailwind CSS, lucide-react, TypeScript strict.

## Global Constraints

- All UI text in Russian
- No new npm dependencies
- TypeScript strict — no `any`, no `!` non-null assertions on nullable data
- API pattern: `await createClient()` → `getUser()` → operate (existing pattern, not changed in this plan)
- React Query staleTime for bookings hooks: `60_000`, `refetchOnWindowFocus: false` — match existing
- `useUpdateParticipant(groupId)` is the existing mutation; its `mutationFn` returns `Promise<BookingParticipant>`
- `useUploadReceipt(groupId)` mutation returns `Promise<{ url: string }>`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `components/ui/inline-edit.tsx` | Modify | Replace click-on-text with pencil-button activation |
| `components/bookings/sessions-list.tsx` | Modify | Full card is a Link; pencil edits title |
| `types/database.ts` | Modify | Add `telegram: string \| null` to `BookingParticipant` |
| `app/api/bookings/participants/[id]/route.ts` | Modify | Add `"telegram"` to allowed PUT fields |
| `components/bookings/participant-drawer.tsx` | Create | 300px detail panel (Telegram, phone, email, payment, receipt) |
| `components/bookings/participant-row.tsx` | Modify | Add `Info` icon as first cell; add `isActive` + `onSelect` props |
| `components/bookings/group-table.tsx` | Modify | Accept + forward selection props; add empty first `<th>`; fix `colSpan` |
| `components/bookings/participants-tab.tsx` | Modify | Hold selected participant state; flex-row layout with drawer |

---

### Task 1: Fix InlineEdit — pencil button activation

**Files:**
- Modify: `components/ui/inline-edit.tsx`

**Interfaces:**
- Produces: `InlineEdit` — same props interface as before, behavior change only. Non-editing state now wraps in `span.group` with a `Pencil` icon button. Editing state unchanged.

- [ ] **Step 1: Replace `components/ui/inline-edit.tsx` with the new implementation**

Replace the entire file content with:

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}

export function InlineEdit({ value, onSave, className, inputClassName, placeholder }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className={cn(
          "bg-transparent border-b border-primary outline-none w-full",
          inputClassName
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span className={cn("group inline-flex items-center gap-1", className)}>
      <span>
        {value || <span className="text-muted-foreground italic">{placeholder}</span>}
      </span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true); }}
        aria-label="Редактировать"
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded text-muted-foreground flex-shrink-0"
      >
        <Pencil size={13} />
      </button>
    </span>
  );
}
```

- [ ] **Step 2: Verify TypeScript build**

Run: `npm run build`
Expected: build succeeds with no errors in `components/ui/inline-edit.tsx` or any file that imports it (sessions-list, session detail page, group-table).

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev` and open `http://localhost:3000/bookings`

Verify:
- Session card titles show as plain text — clicking text does NOT activate editing
- Hovering a card shows a small pencil icon next to the title
- Clicking the pencil icon turns the text into an input field
- Typing and pressing Enter saves; pressing Escape cancels
- Navigation into a session (click card body) still works (Task 2 fixes this fully)

- [ ] **Step 4: Commit**

```bash
git add components/ui/inline-edit.tsx
git commit -m "fix: InlineEdit activates only via pencil button, not text click"
```

---

### Task 2: Fix session card — full card is a navigation Link

**Files:**
- Modify: `components/bookings/sessions-list.tsx`

**Interfaces:**
- Consumes: `InlineEdit` from Task 1 (pencil-button activation in place)
- Produces: `SessionCard` — entire card is a `Link` to `/bookings/{id}`; pencil icon edits title; delete button has `stopPropagation`

- [ ] **Step 1: Rewrite `SessionCard` in `components/bookings/sessions-list.tsx`**

The current `SessionCard` has a `<div>` wrapper with a `<Link>` only around the CalendarDays icon. Replace `SessionCard` with:

```typescript
function SessionCard({ session }: { session: BookingSession }) {
  const del = useDeleteSession();
  const update = useUpdateSession();

  return (
    <Link
      href={`/bookings/${session.id}`}
      className="group relative bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-sm transition-all block"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <CalendarDays size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary">
            <InlineEdit
              value={session.title}
              onSave={(title) => update.mutate({ id: session.id, title })}
              placeholder="Название"
            />
          </p>
          <p className="text-sm text-text-secondary mt-0.5">{formatDate(session.session_date)}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm("Вы уверены, что хотите удалить это мероприятие?")) del.mutate(session.id);
        }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
      >
        <Trash2 size={14} />
      </button>
    </Link>
  );
}
```

Note: `Link` is already imported in this file. The CalendarDays icon is now a plain `<div>` (not a Link) — navigation happens via the entire card wrapper. Remove the `href` from the inner CalendarDays element if one existed.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Run `npm run dev`, open `http://localhost:3000/bookings`.

Verify:
- Clicking anywhere on the card body (not the pencil, not the trash) navigates to `/bookings/{id}`
- Hovering the card shows the pencil icon next to the title
- Clicking the pencil icon activates editing without navigating (due to `e.stopPropagation()` in InlineEdit button)
- Clicking the trash icon deletes (not navigates) due to `e.preventDefault()` + `e.stopPropagation()`

- [ ] **Step 4: Commit**

```bash
git add components/bookings/sessions-list.tsx
git commit -m "fix: session card is a full Link; pencil edits title without navigating"
```

---

### Task 3: Add telegram field to type + API + DB migration

**Files:**
- Modify: `types/database.ts`
- Modify: `app/api/bookings/participants/[id]/route.ts`

**Interfaces:**
- Produces: `BookingParticipant.telegram: string | null` — available to Task 4 and 5
- Produces: PUT `/api/bookings/participants/{id}` accepts `telegram` field

- [ ] **Step 1: Add `telegram` to `BookingParticipant` in `types/database.ts`**

In `types/database.ts`, find the `BookingParticipant` interface and add `telegram: string | null;` after `contact_channel`:

```typescript
export interface BookingParticipant {
  id: string;
  group_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  payment_status: PaymentStatusParticipant;
  booked: boolean;
  payment_date: string | null;
  contact_channel: ContactChannel | null;
  receipt_url: string | null;
  telegram: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Add `"telegram"` to allowed fields in the PUT route**

In `app/api/bookings/participants/[id]/route.ts`, find the `allowed` array and add `"telegram"`:

```typescript
const allowed = ["full_name", "email", "phone", "payment_status", "booked", "payment_date", "contact_channel", "receipt_url", "telegram"];
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: no TypeScript errors.

- [ ] **Step 4: Run DB migration**

In Supabase SQL Editor (https://app.supabase.com → project → SQL Editor), run:

```sql
ALTER TABLE public.booking_participants ADD COLUMN IF NOT EXISTS telegram TEXT;
```

Expected: "Success. No rows returned."

- [ ] **Step 5: Commit**

```bash
git add types/database.ts app/api/bookings/participants/[id]/route.ts
git commit -m "feat: add telegram field to BookingParticipant type and API"
```

---

### Task 4: Create ParticipantDrawer component

**Files:**
- Create: `components/bookings/participant-drawer.tsx`

**Interfaces:**
- Consumes: `BookingParticipant` with `telegram: string | null` from Task 3
- Consumes: `useUpdateParticipant(groupId)` from `@/hooks/use-bookings` — `mutateAsync` returns `Promise<BookingParticipant>`
- Consumes: `useDeleteParticipant(groupId)`, `useUploadReceipt(groupId)` from `@/hooks/use-bookings`
- Produces: `ParticipantDrawer` — default export, props: `{ participant: BookingParticipant; groupId: string; onClose: () => void; onUpdate: (updated: BookingParticipant) => void }`

- [ ] **Step 1: Create `components/bookings/participant-drawer.tsx`**

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, ExternalLink, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useUpdateParticipant, useDeleteParticipant, useUploadReceipt } from "@/hooks/use-bookings";
import type { BookingParticipant } from "@/types/database";

function telegramHref(value: string): string {
  if (!value.trim()) return "";
  if (value.startsWith("http")) return value;
  return `https://t.me/${value.replace(/^@/, "")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface Props {
  participant: BookingParticipant;
  groupId: string;
  onClose: () => void;
  onUpdate: (updated: BookingParticipant) => void;
}

export function ParticipantDrawer({ participant: p, groupId, onClose, onUpdate }: Props) {
  const update = useUpdateParticipant(groupId);
  const del = useDeleteParticipant(groupId);
  const uploadReceipt = useUploadReceipt(groupId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [telegram, setTelegram] = useState(p.telegram ?? "");

  useEffect(() => {
    setTelegram(p.telegram ?? "");
  }, [p.id, p.updated_at]);

  async function handleSave() {
    const result = await update.mutateAsync({ id: p.id, telegram: telegram.trim() || null });
    onUpdate(result);
  }

  async function handleDelete() {
    if (!confirm(`Удалить участника "${p.full_name}"?`)) return;
    await del.mutateAsync(p.id);
    onClose();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadReceipt.mutateAsync({ id: p.id, file });
    onUpdate({ ...p, receipt_url: result.url });
  }

  const tgHref = telegramHref(telegram);

  return (
    <div className="w-[300px] flex-shrink-0 bg-surface border-l border-border flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border flex items-start justify-between gap-2">
        <p className="text-base font-bold text-text-primary leading-snug">{p.full_name}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground flex-shrink-0 mt-0.5"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Telegram */}
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Telegram
          </Label>
          <div className="flex items-center gap-2">
            <Input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@username или ссылка"
              className="h-8 text-sm flex-1"
            />
            <a
              href={tgHref || undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Открыть в Telegram"
              className={cn(
                "p-1.5 rounded-lg transition-colors flex-shrink-0",
                tgHref
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground/30 pointer-events-none"
              )}
            >
              <Send size={15} />
            </a>
          </div>
        </div>

        {/* Phone */}
        {p.phone && (
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Телефон
            </Label>
            <a href={`tel:${p.phone}`} className="block text-sm text-primary hover:underline">
              {p.phone}
            </a>
          </div>
        )}

        {/* Email */}
        {p.email && (
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Email
            </Label>
            <a href={`mailto:${p.email}`} className="block text-sm text-primary hover:underline">
              {p.email}
            </a>
          </div>
        )}

        {/* Payment */}
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Оплата
          </Label>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
              p.payment_status === "paid"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            )}
          >
            {p.payment_status === "paid" ? "Оплачено" : "Не оплачено"}
          </span>
          {p.payment_date && (
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(p.payment_date)}</p>
          )}
        </div>

        {/* Booked */}
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Место
          </Label>
          <p className="text-sm text-text-primary">
            {p.booked ? "Забронировано" : "Не забронировано"}
          </p>
        </div>

        {/* Receipt */}
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Чек
          </Label>
          {p.receipt_url ? (
            <a
              href={p.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
            >
              <ExternalLink size={13} /> Открыть чек
            </a>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadReceipt.isPending}
                className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                <Upload size={13} />
                {uploadReceipt.isPending ? "Загрузка..." : "Загрузить чек"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFile}
              />
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-red-200 text-red-500 hover:bg-red-50 mr-auto"
          onClick={handleDelete}
          disabled={del.isPending}
        >
          Удалить
        </Button>
        <Button
          size="sm"
          className="text-xs"
          onClick={handleSave}
          disabled={update.isPending}
        >
          {update.isPending ? "..." : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: no errors. The component is created but not yet imported anywhere — it won't be exercised until Task 5.

- [ ] **Step 3: Commit**

```bash
git add components/bookings/participant-drawer.tsx
git commit -m "feat: add ParticipantDrawer component"
```

---

### Task 5: Wire participant selection — Row, GroupTable, ParticipantsTab

**Files:**
- Modify: `components/bookings/participant-row.tsx`
- Modify: `components/bookings/group-table.tsx`
- Modify: `components/bookings/participants-tab.tsx`

**Interfaces:**
- Consumes: `ParticipantDrawer` from Task 4 — `{ participant, groupId, onClose, onUpdate }`
- Consumes: `BookingParticipant.telegram` from Task 3

- [ ] **Step 1: Replace `components/bookings/participant-row.tsx`**

Replace the entire file:

```typescript
"use client";

import { useRef } from "react";
import { Info, Trash2, Upload, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useUpdateParticipant, useDeleteParticipant, useUploadReceipt } from "@/hooks/use-bookings";
import type { BookingParticipant, ContactChannel } from "@/types/database";

interface Props {
  participant: BookingParticipant;
  groupId: string;
  isActive: boolean;
  onSelect: () => void;
}

export function ParticipantRow({ participant: p, groupId, isActive, onSelect }: Props) {
  const update = useUpdateParticipant(groupId);
  const del = useDeleteParticipant(groupId);
  const uploadReceipt = useUploadReceipt(groupId);
  const fileRef = useRef<HTMLInputElement>(null);

  function blur(field: string, value: unknown) {
    update.mutate({ id: p.id, [field]: value });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadReceipt.mutateAsync({ id: p.id, file });
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-2 py-2 w-8">
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "p-1 rounded transition-colors",
            isActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          )}
        >
          <Info size={14} />
        </button>
      </td>
      <td className="px-3 py-2 min-w-[130px]">
        <Input
          defaultValue={p.full_name}
          onBlur={(e) => blur("full_name", e.target.value)}
          className="h-8 text-sm border-transparent hover:border-border focus:border-border"
          placeholder="ФИО"
        />
      </td>
      <td className="px-3 py-2 min-w-[150px]">
        <Input
          defaultValue={p.email ?? ""}
          onBlur={(e) => blur("email", e.target.value || null)}
          className="h-8 text-sm border-transparent hover:border-border focus:border-border"
          placeholder="email"
        />
      </td>
      <td className="px-3 py-2 min-w-[130px]">
        <Input
          defaultValue={p.phone ?? ""}
          onBlur={(e) => blur("phone", e.target.value || null)}
          className="h-8 text-sm border-transparent hover:border-border focus:border-border"
          placeholder="+7..."
        />
      </td>
      <td className="px-3 py-2 min-w-[130px]">
        <Select
          defaultValue={p.payment_status}
          onValueChange={(v) => blur("payment_status", v)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">Оплачено</SelectItem>
            <SelectItem value="unpaid">Не оплачено</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2 min-w-[100px]">
        <Select
          defaultValue={p.booked ? "yes" : "no"}
          onValueChange={(v) => blur("booked", v === "yes")}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Да</SelectItem>
            <SelectItem value="no">Нет</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2 min-w-[140px]">
        <Input
          type="date"
          defaultValue={p.payment_date ?? ""}
          onBlur={(e) => blur("payment_date", e.target.value || null)}
          className="h-8 text-sm border-transparent hover:border-border focus:border-border"
        />
      </td>
      <td className="px-3 py-2 min-w-[130px]">
        <Select
          defaultValue={p.contact_channel ?? ""}
          onValueChange={(v) => blur("contact_channel", (v as ContactChannel) || null)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="other">Другое</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2 min-w-[80px] text-center">
        {p.receipt_url ? (
          <a
            href={p.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
          >
            <ExternalLink size={12} /> Чек
          </a>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadReceipt.isPending}
              className="inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-primary transition-colors"
            >
              <Upload size={12} /> {uploadReceipt.isPending ? "..." : "Загрузить"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFile}
            />
          </>
        )}
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={() => {
            if (confirm(`Удалить участника "${p.full_name}"?`)) del.mutate(p.id);
          }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}
```

- [ ] **Step 2: Replace `components/bookings/group-table.tsx`**

Replace the entire file:

```typescript
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineEdit } from "@/components/ui/inline-edit";
import { useParticipants, useCreateParticipant, useDeleteGroup, useUpdateGroup } from "@/hooks/use-bookings";
import { ParticipantRow } from "./participant-row";
import type { BookingGroup, BookingParticipant } from "@/types/database";

interface Props {
  group: BookingGroup;
  sessionId: string;
  selectedParticipantId: string | null;
  onSelectParticipant: (p: BookingParticipant | null) => void;
}

export function GroupTable({ group, sessionId, selectedParticipantId, onSelectParticipant }: Props) {
  const { data: participants = [], isLoading } = useParticipants(group.id);
  const create = useCreateParticipant(group.id);
  const update = useUpdateGroup(sessionId);
  const del = useDeleteGroup(sessionId);
  const [addName, setAddName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  async function handleAdd() {
    if (!addName.trim()) return;
    await create.mutateAsync({
      full_name: addName.trim(),
      email: null,
      phone: null,
      payment_status: "unpaid",
      booked: false,
      payment_date: null,
      contact_channel: null,
      telegram: null,
    });
    setAddName("");
    setShowAdd(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">
          <InlineEdit
            value={group.name}
            onSave={(name) => update.mutate({ id: group.id, name })}
            className="text-base"
            inputClassName="text-base font-semibold"
            placeholder="Название группы"
          />
        </h3>
        <button
          type="button"
          onClick={() => {
            if (confirm("Вы уверены, что хотите удалить эту группу со всеми участниками?"))
              del.mutate(group.id);
          }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              {["", "ФИО", "Email", "Телефон", "Оплата", "Забронир.", "Дата оплаты", "Канал", "Чек", ""].map(
                (h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-3 py-4 text-center text-muted-foreground text-sm">
                  Загрузка...
                </td>
              </tr>
            ) : participants.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-4 text-center text-muted-foreground text-sm">
                  Нет участников
                </td>
              </tr>
            ) : (
              participants.map((p) => (
                <ParticipantRow
                  key={p.id}
                  participant={p}
                  groupId={group.id}
                  isActive={selectedParticipantId === p.id}
                  onSelect={() =>
                    onSelectParticipant(selectedParticipantId === p.id ? null : p)
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd ? (
        <div className="flex gap-2 items-center">
          <Input
            autoFocus
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="ФИО участника"
            className="h-8 text-sm max-w-xs"
          />
          <Button size="sm" onClick={handleAdd} disabled={create.isPending}>
            Добавить
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
            Отмена
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Участник
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Replace `components/bookings/participants-tab.tsx`**

Replace the entire file:

```typescript
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useGroups, useCreateGroup } from "@/hooks/use-bookings";
import { GroupTable } from "./group-table";
import { ParticipantDrawer } from "./participant-drawer";
import type { BookingParticipant } from "@/types/database";

interface Props {
  sessionId: string;
}

export function ParticipantsTab({ sessionId }: Props) {
  const { data: groups = [], isLoading } = useGroups(sessionId);
  const create = useCreateGroup(sessionId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<BookingParticipant | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    await create.mutateAsync({ name: name.trim(), position: groups.length });
    setName("");
    setDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus size={14} /> Добавить группу
        </Button>
      </div>

      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <p className="font-medium">Групп пока нет</p>
              <p className="text-sm mt-1">Создай группу, чтобы добавлять участников</p>
            </div>
          ) : (
            groups.map((g) => (
              <GroupTable
                key={g.id}
                group={g}
                sessionId={sessionId}
                selectedParticipantId={selectedParticipant?.id ?? null}
                onSelectParticipant={setSelectedParticipant}
              />
            ))
          )}
        </div>

        {selectedParticipant && (
          <ParticipantDrawer
            participant={selectedParticipant}
            groupId={selectedParticipant.group_id}
            onClose={() => setSelectedParticipant(null)}
            onUpdate={(updated) => setSelectedParticipant(updated)}
          />
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Новая группа</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Название группы</Label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Очный, Онлайн, VIP..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreate} disabled={create.isPending}>
                Создать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors across all 5 modified/created files.

- [ ] **Step 5: Manual end-to-end test**

Run `npm run dev`. Open `http://localhost:3000/bookings`, enter any booking session, go to "Участники" tab.

Verify:
1. Each participant row has an `Info` icon as its first cell (leftmost)
2. Clicking the Info icon opens the 300px drawer on the right; the groups table shrinks to fit
3. The active row's Info icon turns blue/highlighted
4. Clicking the same Info icon again closes the drawer
5. Drawer shows: participant name (header), Telegram input, phone (if set), email (if set), payment badge, booked status, receipt section
6. Type a Telegram handle (`@username`) → Send icon becomes active → clicking it opens `https://t.me/username` in a new tab
7. Clicking "Сохранить" — the telegram value is saved to Supabase; refresh the page and reopen the drawer to confirm it persisted
8. Clicking "Удалить" in the drawer removes the participant and closes the drawer
9. The receipt section shows "Загрузить чек" if no receipt, or "Открыть чек" link if one exists

- [ ] **Step 6: Commit and push**

```bash
git add components/bookings/participant-row.tsx components/bookings/group-table.tsx components/bookings/participants-tab.tsx
git commit -m "feat: add participant drawer with Telegram link and Info button trigger"
git push origin master
```
