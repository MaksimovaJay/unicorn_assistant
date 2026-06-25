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
  telegram: string | null;
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
  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingGroup {
  id: string;
  session_id: string;
  name: string;
  position: number;
  created_at: string;
}

export type PaymentStatusParticipant = "paid" | "unpaid";
export type ContactChannel = "telegram" | "whatsapp" | "other";

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
    Views: Record<never, never>;
    Functions: {
      get_profile_for_user: {
        Args: { p_user_id: string };
        Returns: Array<{ id: string; workspace_id: string; full_name: string; role: string }>;
      };
    };
    Tables: {
      workspaces: {
        Row: Workspace & { [key: string]: unknown };
        Insert: Omit<Workspace, "id" | "created_at"> & { [key: string]: unknown };
        Update: Partial<Omit<Workspace, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      profiles: {
        Row: Profile & { [key: string]: unknown };
        Insert: Omit<Profile, "created_at"> & { [key: string]: unknown };
        Update: Partial<Omit<Profile, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      events: {
        Row: Event & { [key: string]: unknown };
        Insert: Omit<Event, "id" | "created_at" | "updated_at"> & { [key: string]: unknown };
        Update: Partial<Omit<Event, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      tasks: {
        Row: Task & { [key: string]: unknown };
        Insert: Omit<Task, "id" | "created_at" | "updated_at"> & { [key: string]: unknown };
        Update: Partial<Omit<Task, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      contacts: {
        Row: Contact & { [key: string]: unknown };
        Insert: Omit<Contact, "id" | "created_at" | "updated_at"> & { [key: string]: unknown };
        Update: Partial<Omit<Contact, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      booking_sessions: {
        Row: BookingSession & { [key: string]: unknown };
        Insert: Omit<BookingSession, "id" | "created_at"> & { [key: string]: unknown };
        Update: Partial<Omit<BookingSession, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      booking_slots: {
        Row: BookingSlot & { [key: string]: unknown };
        Insert: Omit<BookingSlot, "id" | "created_at" | "updated_at"> & { [key: string]: unknown };
        Update: Partial<Omit<BookingSlot, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      payments: {
        Row: Payment & { [key: string]: unknown };
        Insert: Omit<Payment, "id" | "created_at" | "updated_at"> & { [key: string]: unknown };
        Update: Partial<Omit<Payment, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      payment_history: {
        Row: PaymentHistoryEntry & { [key: string]: unknown };
        Insert: Omit<PaymentHistoryEntry, "id" | "created_at"> & { [key: string]: unknown };
        Update: Partial<Omit<PaymentHistoryEntry, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      notes: {
        Row: Note & { [key: string]: unknown };
        Insert: Omit<Note, "id" | "created_at" | "updated_at"> & { [key: string]: unknown };
        Update: Partial<Omit<Note, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      files: {
        Row: AppFile & { [key: string]: unknown };
        Insert: Omit<AppFile, "id" | "created_at"> & { [key: string]: unknown };
        Update: Partial<Omit<AppFile, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      notifications: {
        Row: Notification & { [key: string]: unknown };
        Insert: Omit<Notification, "id" | "created_at"> & { [key: string]: unknown };
        Update: Partial<Omit<Notification, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      activity_logs: {
        Row: ActivityLog & { [key: string]: unknown };
        Insert: Omit<ActivityLog, "id" | "created_at"> & { [key: string]: unknown };
        Update: { [key: string]: unknown };
        Relationships: [];
      };
      links: {
        Row: { id: string; workspace_id: string; title: string; url: string; created_by: string | null; created_at: string };
        Insert: { workspace_id: string; title: string; url: string; created_by?: string | null };
        Update: { title?: string; url?: string };
        Relationships: [];
      };
      booking_groups: {
        Row: BookingGroup & { [key: string]: unknown };
        Insert: Omit<BookingGroup, "id" | "created_at"> & { [key: string]: unknown };
        Update: Partial<Omit<BookingGroup, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
      booking_participants: {
        Row: BookingParticipant & { [key: string]: unknown };
        Insert: Omit<BookingParticipant, "id" | "created_at" | "updated_at"> & { [key: string]: unknown };
        Update: Partial<Omit<BookingParticipant, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: [];
      };
    };
  };
}
