# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a working Next.js 15 app with Supabase auth, full database schema (13 tables + RLS policies), design system, and app layout shell — end state is: login → authenticated workspace with sidebar navigation to all 10 module placeholder pages.

**Architecture:** App Router with two route groups: `(auth)` for unauthenticated pages, `(workspace)` for protected pages. Supabase SSR handles cookie-based sessions. Middleware redirects unauthenticated users to `/login`. All 13 DB tables created in one SQL migration run in the Supabase Dashboard SQL Editor. Workspace + profile created via API route on first signup.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, TailwindCSS, Shadcn UI, @supabase/ssr, @supabase/supabase-js, @tanstack/react-query, react-hook-form, zod, lucide-react, next/font (Nunito)

---

## File Map

| File | Responsibility |
|------|---------------|
| `.env.local` | Supabase URL + anon key (not committed) |
| `.env.example` | Credentials template (committed) |
| `tailwind.config.ts` | Design system tokens (colors, radius, shadows) |
| `app/globals.css` | CSS variables for Shadcn + base styles |
| `app/layout.tsx` | Root layout with Nunito font + QueryProvider |
| `app/page.tsx` | Root redirect to /dashboard |
| `middleware.ts` | Protect workspace routes, redirect to /login |
| `app/auth/callback/route.ts` | Supabase email confirm callback |
| `app/(auth)/layout.tsx` | Centered auth layout |
| `app/(auth)/login/page.tsx` | Login form |
| `app/(auth)/signup/page.tsx` | Signup form |
| `app/api/setup-workspace/route.ts` | Create workspace + profile on first signup |
| `app/(workspace)/layout.tsx` | Sidebar + Topbar shell + auth guard |
| `app/(workspace)/dashboard/page.tsx` | Placeholder |
| `app/(workspace)/calendar/page.tsx` | Placeholder |
| `app/(workspace)/tasks/page.tsx` | Placeholder |
| `app/(workspace)/contacts/page.tsx` | Placeholder |
| `app/(workspace)/bookings/page.tsx` | Placeholder |
| `app/(workspace)/payments/page.tsx` | Placeholder |
| `app/(workspace)/notes/page.tsx` | Placeholder |
| `app/(workspace)/files/page.tsx` | Placeholder |
| `app/(workspace)/activity/page.tsx` | Placeholder |
| `app/(workspace)/settings/page.tsx` | Placeholder |
| `components/layout/sidebar.tsx` | Left nav with active state |
| `components/layout/topbar.tsx` | Search bar + notification bell + logout |
| `components/layout/coming-soon.tsx` | Reusable placeholder component |
| `components/providers/query-provider.tsx` | React Query wrapper |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client (cookies) |
| `lib/utils.ts` | cn() helper |
| `types/database.ts` | TypeScript types for all 13 DB tables |
| `supabase/migrations/001_initial_schema.sql` | All tables + RLS policies |

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `unicorn_assistant_web/` (entire project)

- [ ] **Step 1: Create project**

In terminal, navigate to `c:\Users\evgen\OneDrive\Desktop\THMJAY WORK\unicorn_assistant\` then run:

```bash
npx create-next-app@latest unicorn_assistant_web --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --turbopack
```

When prompted for any remaining options, accept defaults.

- [ ] **Step 2: Install dependencies**

```bash
cd unicorn_assistant_web
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react date-fns
npm install class-variance-authority clsx tailwind-merge
npm install tailwindcss-animate
```

- [ ] **Step 3: Initialize Shadcn UI**

```bash
npx shadcn@latest init -d
```

The `-d` flag uses defaults (style: default, base color: neutral, CSS variables: yes).

- [ ] **Step 4: Add Shadcn components**

```bash
npx shadcn@latest add button input label card avatar dropdown-menu sheet separator badge tooltip
```

- [ ] **Step 5: Verify project starts**

```bash
npm run dev
```

Expected: App runs at http://localhost:3000. No red errors in terminal.

- [ ] **Step 6: Commit initial scaffold**

```bash
git init
git add .
git commit -m "chore: initialize Next.js 15 project with Shadcn UI"
```

---

## Task 2: Design System

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F996A5",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#FABE3E",
          foreground: "#2D2020",
        },
        background: "#FEF3F3",
        surface: "#FFFFFF",
        border: "#F0DCDC",
        "text-primary": "#2D2020",
        "text-secondary": "#5A3D3D",
        success: "#22C55E",
        warning: "#FABE3E",
        danger: "#EF4444",
      },
      borderRadius: {
        sm: "12px",
        DEFAULT: "12px",
        md: "20px",
        lg: "32px",
        full: "999px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.08)",
        soft: "0 2px 12px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 2: Replace app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 100% 97%;
    --foreground: 0 47% 15%;
    --card: 0 0% 100%;
    --card-foreground: 0 47% 15%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 47% 15%;
    --primary: 351 89% 78%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 60% 96%;
    --secondary-foreground: 0 47% 15%;
    --muted: 0 60% 96%;
    --muted-foreground: 0 30% 37%;
    --accent: 42 95% 61%;
    --accent-foreground: 0 47% 15%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 50% 88%;
    --input: 0 50% 88%;
    --ring: 351 89% 78%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 0 20% 10%;
    --foreground: 0 100% 97%;
    --card: 0 20% 13%;
    --card-foreground: 0 100% 97%;
    --popover: 0 20% 13%;
    --popover-foreground: 0 100% 97%;
    --primary: 351 89% 78%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 20% 18%;
    --secondary-foreground: 0 100% 97%;
    --muted: 0 20% 18%;
    --muted-foreground: 0 30% 70%;
    --accent: 42 95% 61%;
    --accent-foreground: 0 47% 15%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 20% 22%;
    --input: 0 20% 22%;
    --ring: 351 89% 78%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 3: Verify colors load**

Run `npm run dev`, open http://localhost:3000.

Expected: Page background is a soft pink-white (#FEF3F3), not the default white. No console errors.

---

## Task 3: Supabase Client Setup

**Files:**
- Create: `.env.local`
- Create: `.env.example`
- Create: `lib/utils.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Create .env.local**

```
NEXT_PUBLIC_SUPABASE_URL=https://oktruadycdbnkxtifugw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_EaPcitMU-C5kvbStDvFfeA_v6n2CMnK
```

- [ ] **Step 2: Create .env.example**

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

- [ ] **Step 3: Verify .env.local is in .gitignore**

Open `.gitignore`. If `.env.local` is not listed, add it:
```
.env.local
```

- [ ] **Step 4: Create lib/utils.ts**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Create lib/supabase/client.ts**

```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 6: Create lib/supabase/server.ts**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

---

## Task 4: TypeScript Database Types

**Files:**
- Create: `types/database.ts`

- [ ] **Step 1: Create types/database.ts**

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "manager" | "assistant";
export type EventType = "meeting" | "consultation" | "training" | "call" | "personal" | "other";
export type EventStatus = "planned" | "confirmed" | "completed" | "cancelled" | "rescheduled";
export type TaskStatus = "new" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type BookingSlotStatus = "free" | "occupied";
export type PaymentType = "one_time" | "recurring";
export type PaymentStatus = "paid" | "unpaid" | "overdue";
export type ActivityAction = "created" | "updated" | "deleted" | "uploaded" | "status_changed";
export type EntityType = "event" | "task" | "contact" | "payment" | "note" | "booking_slot" | "file";
export type NotificationType = "upcoming_event" | "overdue_task" | "payment_reminder" | "conflict";

export interface Workspace {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  created_at: string;
}

export interface Profile {
  id: string;
  workspace_id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface Event {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  event_type: EventType;
  status: EventStatus;
  location: string | null;
  meeting_link: string | null;
  notes: string | null;
  contact_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  assignee_id: string | null;
  related_event_id: string | null;
  related_contact_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  workspace_id: string;
  full_name: string;
  phone: string | null;
  telegram: string | null;
  email: string | null;
  notes: string | null;
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingSession {
  id: string;
  workspace_id: string;
  title: string;
  session_date: string;
  created_by: string;
  created_at: string;
}

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

export interface Payment {
  id: string;
  workspace_id: string;
  title: string;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistoryEntry {
  id: string;
  payment_id: string;
  month: number;
  year: number;
  status: "paid" | "unpaid";
  paid_date: string | null;
  receipt_file_id: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AppFile {
  id: string;
  workspace_id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  entity_type: EntityType;
  entity_id: string;
  uploaded_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  workspace_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  entity_type: EntityType | null;
  entity_id: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  workspace_id: string;
  user_id: string;
  action: ActivityAction;
  entity_type: EntityType;
  entity_id: string;
  entity_title: string;
  metadata: Json;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: Workspace;
        Insert: Omit<Workspace, "id" | "created_at">;
        Update: Partial<Omit<Workspace, "id" | "created_at">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Event, "id" | "created_at">>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Task, "id" | "created_at">>;
      };
      contacts: {
        Row: Contact;
        Insert: Omit<Contact, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Contact, "id" | "created_at">>;
      };
      booking_sessions: {
        Row: BookingSession;
        Insert: Omit<BookingSession, "id" | "created_at">;
        Update: Partial<Omit<BookingSession, "id" | "created_at">>;
      };
      booking_slots: {
        Row: BookingSlot;
        Insert: Omit<BookingSlot, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<BookingSlot, "id" | "created_at">>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Payment, "id" | "created_at">>;
      };
      payment_history: {
        Row: PaymentHistoryEntry;
        Insert: Omit<PaymentHistoryEntry, "id" | "created_at">;
        Update: Partial<Omit<PaymentHistoryEntry, "id" | "created_at">>;
      };
      notes: {
        Row: Note;
        Insert: Omit<Note, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Note, "id" | "created_at">>;
      };
      files: {
        Row: AppFile;
        Insert: Omit<AppFile, "id" | "created_at">;
        Update: Partial<Omit<AppFile, "id" | "created_at">>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at">;
        Update: Partial<Omit<Notification, "id" | "created_at">>;
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, "id" | "created_at">;
        Update: never;
      };
    };
  };
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors (may warn about missing Supabase module types until after DB setup — that's fine).

---

## Task 5: Database Migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

This SQL is run manually in Supabase Dashboard → SQL Editor (no CLI needed).

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/001_initial_schema.sql` with this content:

```sql
-- ================================================
-- UNICORN ASSISTANT — INITIAL SCHEMA v1.0
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- WORKSPACES
-- ================================================
CREATE TABLE workspaces (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  timezone     TEXT NOT NULL DEFAULT 'Asia/Tokyo',
  currency     TEXT NOT NULL DEFAULT 'RUB',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- PROFILES (extends Supabase auth.users)
-- ================================================
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL DEFAULT '',
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'owner'
               CHECK (role IN ('owner', 'manager', 'assistant')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- CONTACTS
-- ================================================
CREATE TABLE contacts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  phone        TEXT,
  telegram     TEXT,
  email        TEXT,
  notes        TEXT,
  favorite     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- EVENTS
-- ================================================
CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  start_at     TIMESTAMPTZ NOT NULL,
  end_at       TIMESTAMPTZ NOT NULL,
  all_day      BOOLEAN NOT NULL DEFAULT FALSE,
  event_type   TEXT NOT NULL DEFAULT 'meeting'
               CHECK (event_type IN ('meeting','consultation','training','call','personal','other')),
  status       TEXT NOT NULL DEFAULT 'planned'
               CHECK (status IN ('planned','confirmed','completed','cancelled','rescheduled')),
  location     TEXT,
  meeting_link TEXT,
  notes        TEXT,
  contact_id   UUID REFERENCES contacts(id) ON DELETE SET NULL,
  created_by   UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- TASKS
-- ================================================
CREATE TABLE tasks (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  description        TEXT,
  status             TEXT NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new','in_progress','done')),
  priority           TEXT NOT NULL DEFAULT 'medium'
                     CHECK (priority IN ('low','medium','high')),
  deadline           DATE,
  assignee_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  related_event_id   UUID REFERENCES events(id) ON DELETE SET NULL,
  related_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  created_by         UUID NOT NULL REFERENCES profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- BOOKING SESSIONS
-- ================================================
CREATE TABLE booking_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  session_date DATE NOT NULL,
  created_by   UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- BOOKING SLOTS
-- ================================================
CREATE TABLE booking_slots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES booking_sessions(id) ON DELETE CASCADE,
  slot_time       TIME NOT NULL,
  status          TEXT NOT NULL DEFAULT 'free'
                  CHECK (status IN ('free','occupied')),
  client_name     TEXT,
  client_phone    TEXT,
  client_telegram TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- PAYMENTS
-- ================================================
CREATE TABLE payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'RUB',
  type         TEXT NOT NULL DEFAULT 'one_time'
               CHECK (type IN ('one_time','recurring')),
  status       TEXT NOT NULL DEFAULT 'unpaid'
               CHECK (status IN ('paid','unpaid','overdue')),
  due_date     DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- PAYMENT HISTORY
-- ================================================
CREATE TABLE payment_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            INT NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  status          TEXT NOT NULL DEFAULT 'unpaid'
                  CHECK (status IN ('paid','unpaid')),
  paid_date       DATE,
  receipt_file_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_id, month, year)
);

-- ================================================
-- NOTES
-- ================================================
CREATE TABLE notes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT '',
  content      TEXT NOT NULL DEFAULT '',
  tags         TEXT[] NOT NULL DEFAULT '{}',
  pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  archived     BOOLEAN NOT NULL DEFAULT FALSE,
  created_by   UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- FILES
-- ================================================
CREATE TABLE files (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  size         BIGINT NOT NULL DEFAULT 0,
  mime_type    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  entity_type  TEXT NOT NULL
               CHECK (entity_type IN ('event','task','contact','payment','note','booking_slot','file')),
  entity_id    UUID NOT NULL,
  uploaded_by  UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- NOTIFICATIONS
-- ================================================
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL
               CHECK (type IN ('upcoming_event','overdue_task','payment_reminder','conflict')),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  read         BOOLEAN NOT NULL DEFAULT FALSE,
  entity_type  TEXT
               CHECK (entity_type IN ('event','task','contact','payment','note','booking_slot','file')),
  entity_id    UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- ACTIVITY LOGS
-- ================================================
CREATE TABLE activity_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id),
  action       TEXT NOT NULL
               CHECK (action IN ('created','updated','deleted','uploaded','status_changed')),
  entity_type  TEXT NOT NULL
               CHECK (entity_type IN ('event','task','contact','payment','note','booking_slot','file')),
  entity_id    UUID NOT NULL,
  entity_title TEXT NOT NULL,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- AUTO updated_at TRIGGERS
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at     BEFORE UPDATE ON contacts      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER events_updated_at       BEFORE UPDATE ON events        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at        BEFORE UPDATE ON tasks         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER booking_slots_updated_at BEFORE UPDATE ON booking_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payments_updated_at     BEFORE UPDATE ON payments      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER notes_updated_at        BEFORE UPDATE ON notes         FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================
ALTER TABLE workspaces       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_slots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE files            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs    ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's workspace_id
CREATE OR REPLACE FUNCTION get_my_workspace_id()
RETURNS UUID AS $$
  SELECT workspace_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ================================================
-- RLS POLICIES
-- ================================================

-- workspaces
CREATE POLICY "own_workspace" ON workspaces
  FOR ALL USING (id = get_my_workspace_id());

-- profiles: read all in workspace, write own
CREATE POLICY "workspace_profiles_read" ON profiles
  FOR SELECT USING (workspace_id = get_my_workspace_id());

CREATE POLICY "own_profile_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "own_profile_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- contacts
CREATE POLICY "workspace_contacts" ON contacts
  FOR ALL
  USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- events
CREATE POLICY "workspace_events" ON events
  FOR ALL
  USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- tasks
CREATE POLICY "workspace_tasks" ON tasks
  FOR ALL
  USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- booking_sessions
CREATE POLICY "workspace_booking_sessions" ON booking_sessions
  FOR ALL
  USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- booking_slots (access via parent session's workspace)
CREATE POLICY "workspace_booking_slots" ON booking_slots
  FOR ALL
  USING (
    session_id IN (
      SELECT id FROM booking_sessions WHERE workspace_id = get_my_workspace_id()
    )
  );

-- payments
CREATE POLICY "workspace_payments" ON payments
  FOR ALL
  USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- payment_history (access via parent payment's workspace)
CREATE POLICY "workspace_payment_history" ON payment_history
  FOR ALL
  USING (
    payment_id IN (
      SELECT id FROM payments WHERE workspace_id = get_my_workspace_id()
    )
  );

-- notes
CREATE POLICY "workspace_notes" ON notes
  FOR ALL
  USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- files
CREATE POLICY "workspace_files" ON files
  FOR ALL
  USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- notifications (own user only)
CREATE POLICY "own_notifications" ON notifications
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- activity_logs (workspace read, insert only — no delete/update)
CREATE POLICY "workspace_activity_read" ON activity_logs
  FOR SELECT USING (workspace_id = get_my_workspace_id());

CREATE POLICY "workspace_activity_insert" ON activity_logs
  FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id());
```

- [ ] **Step 2: Run migration in Supabase**

1. Open [supabase.com](https://supabase.com) → your `unicorn-assistant` project
2. Left sidebar → **SQL Editor**
3. Click **New query**
4. Paste the entire SQL from the file above
5. Click **Run** (or Ctrl+Enter)

Expected: Green "Success. No rows returned" message. No red errors.

If you see an error about a table already existing, click the three dots next to the query and choose "Run selected" starting from the failing line.

- [ ] **Step 3: Verify in Table Editor**

Supabase Dashboard → **Table Editor**.

Expected: 13 tables visible: `workspaces`, `profiles`, `contacts`, `events`, `tasks`, `booking_sessions`, `booking_slots`, `payments`, `payment_history`, `notes`, `files`, `notifications`, `activity_logs`.

- [ ] **Step 4: Commit migration file**

```bash
git add supabase/
git commit -m "feat: add initial database schema with RLS policies"
```

---

## Task 6: Auth Middleware & Callback

**Files:**
- Create: `middleware.ts`
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Create middleware.ts**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPath = path.startsWith("/login") || path.startsWith("/signup");
  const isApiPath = path.startsWith("/api") || path.startsWith("/auth");

  if (!user && !isAuthPath && !isApiPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Create app/auth/callback/route.ts**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
```

---

## Task 7: Auth Pages

**Files:**
- Create: `app/page.tsx`
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`
- Create: `app/api/setup-workspace/route.ts`

- [ ] **Step 1: Create app/page.tsx**

```typescript
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
```

- [ ] **Step 2: Create app/(auth)/layout.tsx**

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🦄</div>
          <h1 className="text-2xl font-black text-text-primary">Unicorn Assistant</h1>
          <p className="text-text-secondary text-sm mt-1 font-semibold">
            Рабочее пространство
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create app/(auth)/login/page.tsx**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Неверный email или пароль");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="rounded-[20px] shadow-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-extrabold text-text-primary">
          Добро пожаловать
        </CardTitle>
        <CardDescription className="text-text-secondary font-semibold">
          Войдите в рабочее пространство
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-primary font-semibold text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-11 rounded-[12px] border-border focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-text-primary font-semibold text-sm">
              Пароль
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-11 rounded-[12px] border-border focus-visible:ring-primary"
            />
          </div>

          {error && (
            <p className="text-danger text-sm font-semibold">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-all"
          >
            {loading ? "Входим..." : "Войти"}
          </Button>

          <p className="text-center text-sm text-text-secondary font-semibold">
            Нет аккаунта?{" "}
            <Link
              href="/signup"
              className="text-primary font-bold hover:underline"
            >
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create app/(auth)/signup/page.tsx**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const res = await fetch("/api/setup-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name }),
      });

      if (!res.ok) {
        setError("Не удалось создать рабочее пространство. Попробуйте снова.");
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="rounded-[20px] shadow-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-extrabold text-text-primary">
          Создать аккаунт
        </CardTitle>
        <CardDescription className="text-text-secondary font-semibold">
          Зарегистрируйтесь в рабочем пространстве
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-text-primary font-semibold text-sm">
              Имя
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              required
              className="h-11 rounded-[12px] border-border focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-primary font-semibold text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-11 rounded-[12px] border-border focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-text-primary font-semibold text-sm">
              Пароль
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              minLength={8}
              required
              className="h-11 rounded-[12px] border-border focus-visible:ring-primary"
            />
          </div>

          {error && (
            <p className="text-danger text-sm font-semibold">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-all"
          >
            {loading ? "Создаём..." : "Зарегистрироваться"}
          </Button>

          <p className="text-center text-sm text-text-secondary font-semibold">
            Уже есть аккаунт?{" "}
            <Link
              href="/login"
              className="text-primary font-bold hover:underline"
            >
              Войти
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Create app/api/setup-workspace/route.ts**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { fullName } = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Idempotent: skip if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existingProfile) {
    return NextResponse.json({ success: true });
  }

  // Create workspace
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name: "unicorn-assistant" })
    .select()
    .single();

  if (wsError || !workspace) {
    return NextResponse.json({ error: wsError?.message }, { status: 500 });
  }

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    workspace_id: workspace.id,
    full_name: fullName || user.email?.split("@")[0] || "User",
    role: "owner",
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, workspaceId: workspace.id });
}
```

---

## Task 8: App Layout — Providers, Sidebar, Topbar

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/providers/query-provider.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/topbar.tsx`
- Create: `components/layout/coming-soon.tsx`
- Create: `app/(workspace)/layout.tsx`

- [ ] **Step 1: Create components/providers/query-provider.tsx**

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 2: Replace app/layout.tsx**

```typescript
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Unicorn Assistant",
  description: "Your private workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={nunito.variable}>
      <body className="font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Add font-sans to tailwind.config.ts**

Open `tailwind.config.ts`. Inside `theme.extend`, the `colors` block is already there from Task 2. Add `fontFamily` right above `colors`:

```typescript
fontFamily: {
  sans: ["var(--font-nunito)", "Nunito", "sans-serif"],
},
colors: {
  // ... (already there, don't replace)
```

- [ ] **Step 4: Create components/layout/sidebar.tsx**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Users,
  BookOpen,
  CreditCard,
  FileText,
  FolderOpen,
  Activity,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Календарь", icon: Calendar },
  { href: "/tasks", label: "Задачи", icon: CheckSquare },
  { href: "/contacts", label: "Контакты", icon: Users },
  { href: "/bookings", label: "Записи", icon: BookOpen },
  { href: "/payments", label: "Платежи", icon: CreditCard },
  { href: "/notes", label: "Заметки", icon: FileText },
  { href: "/files", label: "Файлы", icon: FolderOpen },
  { href: "/activity", label: "Активность", icon: Activity },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] min-h-screen bg-surface border-r border-border flex flex-col flex-shrink-0">
      <div className="h-[72px] flex items-center px-6 border-b border-border">
        <span className="text-xl font-black text-text-primary">🦄 Unicorn</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-background hover:text-text-primary"
              )}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 2}
                className="flex-shrink-0"
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 5: Create components/layout/topbar.tsx**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { Bell, Search, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-[72px] bg-surface border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1 max-w-md relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
        />
        <Input
          placeholder="Поиск... (Cmd+K)"
          className="pl-9 h-10 rounded-full border-border bg-background text-sm font-semibold"
          readOnly
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-background"
        >
          <Bell size={20} className="text-text-secondary" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="h-10 w-10 rounded-full hover:bg-background"
          title="Выйти"
        >
          <LogOut size={18} className="text-text-secondary" />
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Create components/layout/coming-soon.tsx**

```typescript
import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-[20px] bg-primary/10 flex items-center justify-center mb-4">
        <Icon size={32} className="text-primary" />
      </div>
      <h2 className="text-2xl font-extrabold text-text-primary mb-2">{title}</h2>
      <p className="text-text-secondary text-sm max-w-xs font-semibold">{description}</p>
      <div className="mt-4 px-4 py-2 bg-accent/20 rounded-full text-xs font-bold text-text-secondary">
        Скоро
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create app/(workspace)/layout.tsx**

```typescript
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

---

## Task 9: Placeholder Pages

**Files:**
- Create: all 10 pages under `app/(workspace)/`

- [ ] **Step 1: Create app/(workspace)/dashboard/page.tsx**

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

- [ ] **Step 2: Create remaining 9 placeholder pages**

`app/(workspace)/calendar/page.tsx`:
```typescript
import { Calendar } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
export default function CalendarPage() {
  return <ComingSoon icon={Calendar} title="Календарь" description="Все события и встречи в одном месте" />;
}
```

`app/(workspace)/tasks/page.tsx`:
```typescript
import { CheckSquare } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
export default function TasksPage() {
  return <ComingSoon icon={CheckSquare} title="Задачи" description="Список и канбан-доска для управления задачами" />;
}
```

`app/(workspace)/contacts/page.tsx`:
```typescript
import { Users } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
export default function ContactsPage() {
  return <ComingSoon icon={Users} title="Контакты" description="База контактов с привязкой к событиям и задачам" />;
}
```

`app/(workspace)/bookings/page.tsx`:
```typescript
import { BookOpen } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
export default function BookingsPage() {
  return <ComingSoon icon={BookOpen} title="Записи" description="Управление слотами консультаций" />;
}
```

`app/(workspace)/payments/page.tsx`:
```typescript
import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
export default function PaymentsPage() {
  return <ComingSoon icon={CreditCard} title="Платежи" description="Разовые и регулярные платежи с историей" />;
}
```

`app/(workspace)/notes/page.tsx`:
```typescript
import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
export default function NotesPage() {
  return <ComingSoon icon={FileText} title="Заметки" description="Markdown заметки с тегами" />;
}
```

`app/(workspace)/files/page.tsx`:
```typescript
import { FolderOpen } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
export default function FilesPage() {
  return <ComingSoon icon={FolderOpen} title="Файлы" description="Хранилище документов и медиафайлов" />;
}
```

`app/(workspace)/activity/page.tsx`:
```typescript
import { Activity } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
export default function ActivityPage() {
  return <ComingSoon icon={Activity} title="Активность" description="История всех изменений в рабочем пространстве" />;
}
```

`app/(workspace)/settings/page.tsx`:
```typescript
import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
export default function SettingsPage() {
  return <ComingSoon icon={Settings} title="Настройки" description="Управление пользователями и рабочим пространством" />;
}
```

---

## Task 10: Final Verification & Commit

- [ ] **Step 1: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Build completes with no errors. Warnings about missing env variables during build are OK — the app uses them at runtime.

- [ ] **Step 3: Test full login flow**

```bash
npm run dev
```

Open http://localhost:3000 and test:

1. `/` → redirects to `/login` ✓
2. Go to `/signup` → fill name, email, password → submit
3. Redirects to `/dashboard` with sidebar visible ✓
4. Click each nav item → each page shows "Скоро" placeholder ✓
5. Click logout → redirects to `/login` ✓
6. Try navigating to `/dashboard` while logged out → redirects to `/login` ✓

- [ ] **Step 4: Verify DB records**

Supabase Dashboard → Table Editor:

1. `workspaces` → 1 row with name "unicorn-assistant" ✓
2. `profiles` → 1 row for your user with role "owner" ✓

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: phase 1 complete — auth, DB schema, design system, app layout"
```

---

## Troubleshooting

**"relation profiles does not exist"** — Migration wasn't run yet. Run the SQL from Task 5 in Supabase SQL Editor.

**Build fails with "Cannot find module @/types/database"** — Ensure `types/database.ts` exists and `tsconfig.json` has `"@/*": ["./*"]` in paths.

**Login redirects back to /login** — Check that Supabase URL and anon key in `.env.local` are correct and match the project dashboard.

**Styles look default** — Ensure `tailwindcss-animate` is installed and `app/globals.css` was fully replaced (not just appended).
