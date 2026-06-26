"use client";

import { useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateSlot, useDeleteSlot } from "@/hooks/use-bookings";
import { cn } from "@/lib/utils";
import type { BookingSlot } from "@/types/database";

interface Props {
  slot: BookingSlot;
  sessionId: string;
}

function addOneHour(t: string): string {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  const total = h * 60 + m + 60;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function SlotTile({ slot, sessionId }: Props) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(slot.slot_time ? slot.slot_time.slice(0, 5) : "");
  const [endTime, setEndTime] = useState(slot.end_time ? slot.end_time.slice(0, 5) : addOneHour(slot.slot_time ?? "09:00"));
  const [status, setStatus] = useState<"free" | "occupied">(slot.status);
  const [telegram, setTelegram] = useState(slot.client_telegram ?? "");
  const [clientName, setClientName] = useState(slot.client_name ?? "");

  const update = useUpdateSlot(sessionId);
  const del = useDeleteSlot(sessionId);

  const tgHandle = slot.client_telegram?.replace("@", "") ?? null;
  const isFree = slot.status === "free";

  async function save() {
    await update.mutateAsync({
      id: slot.id,
      slot_time: time,
      end_time: endTime || null,
      status,
      client_telegram: telegram || null,
      client_name: clientName || null,
    });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            className={cn(
              "relative w-full h-full min-h-[100px] rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md",
              isFree
                ? "bg-primary/5 border-primary/20 hover:border-primary/40"
                : "bg-muted/50 border-border hover:border-muted-foreground/30"
            )}
          />
        }
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-black text-text-primary">
            {slot.slot_time ? slot.slot_time.slice(0, 5) : "—:——"}
            {slot.end_time && (
              <span className="text-sm font-medium text-muted-foreground ml-1">
                — {slot.end_time.slice(0, 5)}
              </span>
            )}
          </span>
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            isFree ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {isFree ? "СВОБОДНО" : "ЗАНЯТО"}
          </span>
        </div>
        {!isFree && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary truncate max-w-[80%]">
              {slot.client_name ?? slot.client_telegram ?? ""}
            </span>
            {tgHandle && (
              <a
                href={`https://t.me/${tgHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:text-primary/80"
              >
                <Send size={12} />
              </a>
            )}
          </div>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="center">
        <div className="space-y-3">
          <p className="text-sm font-semibold">Редактировать слот</p>
          <div className="space-y-1">
            <Label className="text-xs">Начало</Label>
            <Input type="time" value={time} onChange={(e) => { setTime(e.target.value); setEndTime(addOneHour(e.target.value)); }} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Конец</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Статус</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "free" | "occupied")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Свободно</SelectItem>
                <SelectItem value="occupied">Занято</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {status === "occupied" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Имя клиента</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Имя" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Telegram</Label>
                <Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" />
              </div>
            </>
          )}
          <div className="flex justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => { del.mutate(slot.id); setOpen(false); }}
            >
              <Trash2 size={14} className="mr-1" /> Удалить
            </Button>
            <Button size="sm" onClick={save} disabled={update.isPending}>Сохранить</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
