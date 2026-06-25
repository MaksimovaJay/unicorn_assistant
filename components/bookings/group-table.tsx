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
