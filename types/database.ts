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
