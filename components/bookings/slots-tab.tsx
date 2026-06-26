"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSlots, useCreateSlot } from "@/hooks/use-bookings";
import { SlotTile } from "./slot-tile";

interface Props {
  sessionId: string;
}

export function SlotsTab({ sessionId }: Props) {
  const { data: slots = [], isLoading } = useSlots(sessionId);
  const create = useCreateSlot(sessionId);
  const [addTime, setAddTime] = useState("09:00");
  const [addEndTime, setAddEndTime] = useState("10:00");
  const [adding, setAdding] = useState(false);

  function addOneHour(t: string): string {
    const [h, m] = t.split(":").map(Number);
    const total = h * 60 + m + 60;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  async function handleAdd() {
    await create.mutateAsync({ slot_time: addTime, end_time: addEndTime });
    setAdding(false);
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {slots.map((slot) => (
          <SlotTile key={slot.id} slot={slot} sessionId={sessionId} />
        ))}
        {slots.length < 4 && (
          adding ? (
            <div className="min-h-[100px] rounded-2xl border-2 border-dashed border-border p-4 flex flex-col gap-3 justify-center">
              <Input type="time" value={addTime} onChange={(e) => { setAddTime(e.target.value); setAddEndTime(addOneHour(e.target.value)); }} className="text-center" />
              <Input type="time" value={addEndTime} onChange={(e) => setAddEndTime(e.target.value)} className="text-center" />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setAdding(false)}>Отмена</Button>
                <Button size="sm" className="flex-1" onClick={handleAdd} disabled={create.isPending}>Добавить</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="min-h-[100px] rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center text-muted-foreground hover:text-primary"
            >
              <Plus size={24} />
            </button>
          )
        )}
      </div>
      {slots.length >= 4 && (
        <p className="text-xs text-muted-foreground text-center">Максимум 4 слота на мероприятие</p>
      )}
    </div>
  );
}
