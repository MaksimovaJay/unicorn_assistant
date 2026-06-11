# Links Section Design

## Goal

Replace the "Активность" nav item with a "Ссылки" page where both workspace users can save and manage quick-access URLs without developer help.

## Navigation changes

- Sidebar: replace `Activity` → `Links` (icon: `Link2`, route `/links`)
- Mobile nav (more drawer): same replacement

## Page behavior

- Grid of link cards (title + truncated URL)
- Click card → opens URL in new tab
- "Добавить" button → dialog with two fields: Название (required) and URL (required, validated as URL)
- Each card has a delete button (with confirm)
- Empty state: friendly message + "Добавить первую ссылку" button

## Data

New Supabase table `links`:
- `id` uuid primary key default gen_random_uuid()
- `workspace_id` uuid references workspaces(id)
- `title` text not null
- `url` text not null
- `created_by` uuid references profiles(id)
- `created_at` timestamptz default now()

RLS: workspace members can SELECT/INSERT/DELETE their workspace's links.

## API

- `GET /api/links` — fetch all links for workspace
- `POST /api/links` — create link
- `DELETE /api/links/[id]` — delete link

## Components

- `app/(workspace)/links/page.tsx` — page
- `components/links/links-view.tsx` — grid + add button
- `components/links/link-dialog.tsx` — add dialog
- `hooks/use-links.ts` — React Query hooks
