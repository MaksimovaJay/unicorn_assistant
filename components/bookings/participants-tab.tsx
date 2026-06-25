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
