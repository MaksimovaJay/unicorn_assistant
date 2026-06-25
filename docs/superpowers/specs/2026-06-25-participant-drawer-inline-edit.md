# Participant Drawer & InlineEdit Fix Design

## Goal

Two related improvements to the Bookings section:
1. Fix accidental inline editing — text titles activate edit mode on any click; replace with explicit pencil-button activation.
2. Add a participant detail drawer — an info icon at the start of each participant row opens a 300px side panel with all participant data, editable Telegram link, clickable phone/email, and receipt access.

## Architecture

**A. InlineEdit fix:** Modify `components/ui/inline-edit.tsx` — the single component used everywhere. Text becomes static; a `Pencil` icon appears on hover (via `group-hover`), clicking it activates the input field. Also make the session card in `sessions-list.tsx` fully clickable as a `Link` to `/bookings/{id}`.

**B. Participant drawer:** New `components/bookings/participant-drawer.tsx` modeled on `components/tasks/task-drawer.tsx`. State (`selectedParticipant: BookingParticipant | null`) lives in `ParticipantsTab`, which switches to a `flex` row layout to show the drawer alongside the group tables. An `Info` icon button at the start of each `ParticipantRow` selects/deselects the participant. Requires a new `telegram TEXT NULL` DB column.

**Tech Stack:** Next.js App Router, Supabase, TanStack Query v5, Tailwind CSS, lucide-react.

---

## Global Constraints

- All text in Russian
- No new npm dependencies
- TypeScript strict — no `any`, no `!` non-null assertions on nullable data
- API pattern: `await createClient()` → `getUser()` → operate
- React Query: `staleTime: 60_000`, `refetchOnWindowFocus: false` — match existing booking hooks
- `useUpdateParticipant(groupId)` is the existing mutation to call for saving participant changes

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `components/ui/inline-edit.tsx` | Modify | Add pencil-button activation; remove click-on-text |
| `components/bookings/sessions-list.tsx` | Modify | Make session card a full `Link`; remove separate Calendar icon link |
| `types/database.ts` | Modify | Add `telegram: string \| null` to `BookingParticipant` |
| `app/api/bookings/participants/[id]/route.ts` | Modify | Add `"telegram"` to `allowed` fields list |
| `components/bookings/participant-drawer.tsx` | Create | 300px side panel for participant details |
| `components/bookings/participant-row.tsx` | Modify | Add `Info` icon button at start; add `isActive` + `onSelect` props |
| `components/bookings/group-table.tsx` | Modify | Pass `selectedParticipantId` + `onSelectParticipant` down to `ParticipantRow` |
| `components/bookings/participants-tab.tsx` | Modify | Hold selected participant state; flex-row layout with drawer |

**DB migration (user runs in Supabase SQL Editor):**
```sql
ALTER TABLE public.booking_participants ADD COLUMN IF NOT EXISTS telegram TEXT;
```

---

## Section A: InlineEdit Fix

### Component: `components/ui/inline-edit.tsx`

Replace the click-on-text pattern with a pencil-button pattern.

**Non-editing state:**
- Outer `<span>` has `className="group inline-flex items-center gap-1"` (no pointer cursor, no click handler)
- First child: static `<span>` with the value text (or italic placeholder if empty)
- Second child: `<button>` with `Pencil` icon (size 13, lucide-react) — `className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded text-muted-foreground"`
- Clicking the button sets `editing = true` (same useEffect auto-focuses input)

**Editing state:** unchanged — input with onBlur commit, Enter commit, Escape cancel.

### Component: `components/bookings/sessions-list.tsx`

In `SessionCard`:
- Replace the `<div className="group relative ...">` wrapper and the separate `<Link>` calendar icon with a single `<Link href={/bookings/${session.id}} className="group relative ...">` wrapping the entire card
- The `InlineEdit` for session title remains inside — clicking the pencil icon edits, clicking elsewhere on the card navigates
- The delete button keeps `onClick={(e) => { e.stopPropagation(); e.preventDefault(); ... }}`

---

## Section B: Participant Drawer

### DB Migration

```sql
ALTER TABLE public.booking_participants ADD COLUMN IF NOT EXISTS telegram TEXT;
```

### Type: `types/database.ts`

Add `telegram: string | null;` to `BookingParticipant` after `contact_channel`.

### API: `app/api/bookings/participants/[id]/route.ts`

In the `allowed` array, add `"telegram"`:
```typescript
const allowed = ["full_name", "email", "phone", "payment_status", "booked", "payment_date", "contact_channel", "receipt_url", "telegram"];
```

### Component: `components/bookings/participant-drawer.tsx`

300px panel, `flex flex-col`, `bg-surface border-l border-border` — same structure as `TaskDrawer`.

**Props:**
```typescript
interface Props {
  participant: BookingParticipant;
  groupId: string;
  onClose: () => void;
  onUpdate: (updated: BookingParticipant) => void;
}
```

**State:** `telegram: string` — local draft, synced from `participant.telegram ?? ""` via `useEffect([participant.id, participant.updated_at])`.

**Layout:**

```
Header (px-4 pt-4 pb-3 border-b):
  full_name — text-base font-bold text-text-primary (static, not editable here)
  [X] close button (right)

Body (flex-1 overflow-y-auto px-4 py-3 space-y-4):

  TELEGRAM section:
    Label "TELEGRAM" (10px uppercase muted)
    Row: Input (value=telegram, onChange=setTelegram, placeholder="@username или ссылка")
         + <a> button with Send icon (14px) — opens link in new tab
           href = telegram.startsWith("http") ? telegram : `https://t.me/${telegram}`
           disabled/hidden if telegram is empty
           stopPropagation not needed (it's an <a>, not inside a card)

  ТЕЛЕФОН section (shown only if phone is set):
    Label "ТЕЛЕФОН"
    <a href={`tel:${phone}`} className="text-sm text-primary hover:underline">{phone}</a>

  EMAIL section (shown only if email is set):
    Label "EMAIL"
    <a href={`mailto:${email}`} className="text-sm text-primary hover:underline">{email}</a>

  ОПЛАТА section:
    Label "ОПЛАТА"
    Badge: "Оплачено" (green) / "Не оплачено" (red) — read-only display
    If payment_date: small muted text below — formatted date

  МЕСТО section:
    Label "МЕСТО"
    Text: "Забронировано" / "Не забронировано" — read-only

  ЧЕК section:
    Label "ЧЕК"
    If receipt_url: <a href={receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary text-sm hover:underline"><ExternalLink size={13}/> Открыть чек</a>
    If no receipt_url: upload button (reuse useUploadReceipt(groupId) mutation) + hidden file input

Footer (px-4 py-3 border-t flex items-center gap-2):
  [Удалить] button (destructive, left) — calls useDeleteParticipant(groupId), then onClose()
  [Сохранить] button (primary, right) — calls useUpdateParticipant(groupId).mutateAsync({ id, telegram: telegram.trim() || null }), then calls onUpdate(result) with the returned updated participant
```

**Saving:** Only the `telegram` field is saved from the drawer (all other fields remain editable inline in the table row as before).

### Component: `components/bookings/participant-row.tsx`

Add two new props:
```typescript
interface Props {
  participant: BookingParticipant;
  groupId: string;
  isActive: boolean;
  onSelect: () => void;
}
```

Add a new `<td>` as the **first** cell:
```tsx
<td className="px-2 py-2 w-8">
  <button
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
```

Also add `"Info"` to the lucide-react import.

Update the `<th>` list in `group-table.tsx` to add an empty first header.

### Component: `components/bookings/group-table.tsx`

Add props to forward selection state:
```typescript
interface Props {
  group: BookingGroup;
  sessionId: string;
  selectedParticipantId: string | null;
  onSelectParticipant: (p: BookingParticipant | null) => void;
}
```

In `participants.map(...)`:
```tsx
<ParticipantRow
  key={p.id}
  participant={p}
  groupId={group.id}
  isActive={selectedParticipantId === p.id}
  onSelect={() => onSelectParticipant(selectedParticipantId === p.id ? null : p)}
/>
```

Add empty `<th>` as first header cell in the `thead` row.

### Component: `components/bookings/participants-tab.tsx`

Add state:
```typescript
const [selectedParticipant, setSelectedParticipant] = useState<BookingParticipant | null>(null);
```

Change layout from `<div className="space-y-6">` to:
```tsx
<div className="flex gap-4 items-start">
  <div className="flex-1 min-w-0 space-y-6">
    {/* existing groups content */}
    {groups.map((g) => (
      <GroupTable
        key={g.id}
        group={g}
        sessionId={sessionId}
        selectedParticipantId={selectedParticipant?.id ?? null}
        onSelectParticipant={setSelectedParticipant}
      />
    ))}
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
```

When the selected participant's data is updated (after save), the drawer should reflect the new data. Since `selectedParticipant` is a snapshot from query data, after `invalidateQueries` the parent re-renders. To keep drawer in sync: after successful save, update `selectedParticipant` with the returned data from `mutateAsync`.

---

## Data Flow

```
ParticipantsTab
  selectedParticipant state
  → GroupTable (selectedParticipantId, onSelectParticipant)
    → ParticipantRow (isActive, onSelect)
      Info button click → onSelect() → setSelectedParticipant(p)
  → ParticipantDrawer (participant, groupId, onClose)
    Save → useUpdateParticipant(groupId).mutateAsync({ id, telegram })
         → invalidates ["booking-participants", groupId]
         → parent re-renders with fresh data
```

---

## Edge Cases

- Telegram field empty → Send icon hidden (no broken link)
- Telegram value without `http` → construct `https://t.me/{value}` (strip leading `@` if present)
- Receipt already exists → show "Открыть чек" link; if no receipt → show upload button
- Clicking Info on already-selected row → deselects (closes drawer)
- Participant deleted from drawer → `onClose()` called, drawer disappears
- `participant.updated_at` changes after save → `useEffect` re-syncs telegram draft in drawer

## Out of Scope

- Editing name, email, phone, payment from the drawer (stays inline in table)
- Editing payment date, booked status from drawer
- Contact channel editing from drawer
- Any changes to the Slots tab
