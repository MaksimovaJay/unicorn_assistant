"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { MapPin, Clock, Edit2, Trash2, Send } from "lucide-react";
import { useDeleteEvent } from "@/hooks/use-events";
import {
  EVENT_COLORS, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS,
} from "@/lib/calendar-utils";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/types/database";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EventPopoverProps {
  event: Event | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onEdit: (event: Event) => void;
}

export function EventPopover({ event, anchorEl, onClose, onEdit }: EventPopoverProps) {
  const deleteEvent = useDeleteEvent();
  const telegram = event?.telegram?.replace("@", "") ?? null;

  if (!event || !anchorEl) return null;

  async function handleDelete() {
    if (!event) return;
    if (!confirm(`Удалить событие "${event.title}"?`)) return;
    await deleteEvent.mutateAsync(event.id);
    onClose();
  }

  const colors = EVENT_COLORS[event.event_type];

  return (
    <PopoverPrimitive.Root
      open
      onOpenChange={(v) => { if (!v) onClose(); }}
    >
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={anchorEl}
          side="right"
          align="start"
          sideOffset={4}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            className={cn(
              "w-72 rounded-[16px] shadow-lg bg-popover text-popover-foreground p-0 overflow-hidden",
              "ring-1 ring-foreground/10 outline-hidden duration-100",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
          >
            <div
              className="px-4 py-3"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-extrabold text-base leading-tight">{event.title}</h3>
                <div className="flex gap-1 flex-shrink-0">
                  {telegram && (
                    <a
                      href={`https://t.me/${telegram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Написать в Telegram"
                      className="p-1 rounded-full hover:bg-black/10 transition-colors"
                    >
                      <Send size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => { onEdit(event); onClose(); }}
                    className="p-1 rounded-full hover:bg-black/10 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1 rounded-full hover:bg-black/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs mt-1 opacity-80">
                {EVENT_TYPE_LABELS[event.event_type]}
              </p>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} className="flex-shrink-0" />
                <span className="font-semibold">
                  {event.all_day
                    ? format(new Date(event.start_at), "d MMMM yyyy", { locale: ru })
                    : `${format(new Date(event.start_at), "d MMM, HH:mm", { locale: ru })} — ${format(new Date(event.end_at), "HH:mm", { locale: ru })}`}
                </span>
              </div>

              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={14} className="flex-shrink-0" />
                  <span className="font-semibold">{event.location}</span>
                </div>
              )}

              {event.description && (
                <p className="text-sm text-foreground font-semibold">{event.description}</p>
              )}

              <Badge
                variant="secondary"
                className="rounded-full text-xs font-bold"
              >
                {EVENT_STATUS_LABELS[event.status]}
              </Badge>
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
