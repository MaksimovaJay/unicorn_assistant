# Telegram Quick Link Design

## Goal

Add a Telegram icon button to event and booking slot views so Yaroslava can jump directly into a student's chat without searching for them manually.

## Scope

Two surfaces:
1. **Calendar — EventPopover** (implement now)
2. **Bookings — BookingSlot card** (implement when bookings page is built)

## Behavior

- If a telegram handle is available, a Telegram icon appears in the view
- Clicking opens `https://t.me/{username}` in a new tab (strip leading `@` from stored value)
- If no telegram — icon is not shown

## Data sources

| Surface | Telegram field | How to get it |
|---|---|---|
| EventPopover | `Contact.telegram` | Fetch contact by `event.contact_id` via new `useContact(id)` hook |
| BookingSlot card | `BookingSlot.client_telegram` | Already on the slot object — no extra fetch |

## Implementation

### 1. `hooks/use-contact.ts`
New hook: `useContact(id: string | null)` — fetches a single contact from Supabase by id. Returns `{ data: Contact | null, isLoading }`. Skips the query when `id` is null.

### 2. `components/calendar/event-popover.tsx`
- Call `useContact(event?.contact_id ?? null)`
- If `contact.telegram` is present, render a small Telegram icon button (`Send` from lucide-react) next to the contact name or in the action row
- `onClick`: `window.open("https://t.me/" + telegram.replace("@", ""), "_blank")`

### 3. Bookings (future)
When the BookingSlot card component is built, apply the same icon pattern using `slot.client_telegram` directly — no hook needed.

## UI

- Icon: `Send` from lucide-react (matches Telegram aesthetic), size 16, `text-muted-foreground hover:text-primary`
- No label — icon only, with `title="Написать в Telegram"` for accessibility
- Opens in new tab (`target="_blank" rel="noopener noreferrer"`)
