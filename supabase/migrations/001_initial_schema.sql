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

CREATE TRIGGER contacts_updated_at      BEFORE UPDATE ON contacts       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER events_updated_at        BEFORE UPDATE ON events         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at         BEFORE UPDATE ON tasks          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER booking_slots_updated_at BEFORE UPDATE ON booking_slots  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payments_updated_at      BEFORE UPDATE ON payments       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER notes_updated_at         BEFORE UPDATE ON notes          FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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

-- activity_logs (workspace read, insert only)
CREATE POLICY "workspace_activity_read" ON activity_logs
  FOR SELECT USING (workspace_id = get_my_workspace_id());

CREATE POLICY "workspace_activity_insert" ON activity_logs
  FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id());
