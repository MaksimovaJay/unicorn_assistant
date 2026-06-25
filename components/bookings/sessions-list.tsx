"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineEdit } from "@/components/ui/inline-edit";
import { useSessions, useDeleteSession, useUpdateSession } from "@/hooks/use-bookings";
import { SessionDialog } from "./session-dialog";
import type { BookingSession } from "@/types/database";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

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

export function SessionsList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: sessions = [], isLoading } = useSessions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-text-primary">Записи</h1>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-2">
          <Plus size={16} /> Создать мероприятие
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Мероприятий пока нет</p>
          <p className="text-sm mt-1">Создай первое нажатием кнопки выше</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
        </div>
      )}

      <SessionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
