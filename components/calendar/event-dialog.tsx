"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateEvent, useUpdateEvent } from "@/hooks/use-events";
import { detectConflicts, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from "@/lib/calendar-utils";
import type { Event, EventType, EventStatus } from "@/types/database";

const schema = z.object({
  title: z.string().min(1, "Название обязательно"),
  event_type: z.enum(["meeting", "consultation", "training", "call", "personal", "other"] as const),
  status: z.enum(["planned", "confirmed", "completed", "cancelled", "rescheduled"] as const),
  start_at: z.string().min(1, "Укажите дату начала"),
  end_at: z.string().min(1, "Укажите дату окончания"),
  all_day: z.boolean().default(false),
  description: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  defaultStart?: string;
  editEvent?: Event | null;
  allEvents: Event[];
}

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISOLocal(local: string) {
  return new Date(local).toISOString();
}

export function EventDialog({ open, onClose, defaultStart, editEvent, allEvents }: EventDialogProps) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const isEdit = !!editEvent;

  const defaultStartDT = defaultStart
    ? toLocalDatetime(defaultStart)
    : toLocalDatetime(new Date().toISOString());
  const defaultEndDT = defaultStart
    ? toLocalDatetime(new Date(new Date(defaultStart).getTime() + 60 * 60 * 1000).toISOString())
    : toLocalDatetime(new Date(Date.now() + 60 * 60 * 1000).toISOString());

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      title: "",
      event_type: "meeting",
      status: "planned",
      start_at: defaultStartDT,
      end_at: defaultEndDT,
      all_day: false,
    },
  });

  useEffect(() => {
    if (editEvent) {
      reset({
        title: editEvent.title,
        event_type: editEvent.event_type,
        status: editEvent.status,
        start_at: toLocalDatetime(editEvent.start_at),
        end_at: toLocalDatetime(editEvent.end_at),
        all_day: editEvent.all_day,
        description: editEvent.description ?? "",
        location: editEvent.location ?? "",
        notes: editEvent.notes ?? "",
      });
    } else {
      reset({
        title: "",
        event_type: "meeting",
        status: "planned",
        start_at: defaultStartDT,
        end_at: defaultEndDT,
        all_day: false,
        description: "",
        location: "",
        notes: "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editEvent, open]);

  const watchStart = watch("start_at");
  const watchEnd = watch("end_at");
  const watchAllDay = watch("all_day");

  const conflicts = !watchAllDay && watchStart && watchEnd
    ? detectConflicts(allEvents, toISOLocal(watchStart), toISOLocal(watchEnd), editEvent?.id)
    : [];

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      start_at: toISOLocal(values.start_at),
      end_at: toISOLocal(values.end_at),
      description: values.description || null,
      location: values.location || null,
      notes: values.notes || null,
    };

    if (isEdit && editEvent) {
      await updateEvent.mutateAsync({ id: editEvent.id, ...payload });
    } else {
      await createEvent.mutateAsync(payload);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-[20px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-foreground">
            {isEdit ? "Редактировать событие" : "Новое событие"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {conflicts.length > 0 && (
            <div className="rounded-[12px] bg-accent/20 border border-accent/40 px-3 py-2 text-sm font-semibold text-foreground">
              ⚠ Конфликт с {conflicts.length} событием: {conflicts.map(c => c.title).join(", ")}
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-sm font-semibold">Название</Label>
            <Input {...register("title")} className="h-11 rounded-[12px]" placeholder="Название события" />
            {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Тип</Label>
              <Select
                defaultValue={editEvent?.event_type ?? "meeting"}
                onValueChange={(v) => setValue("event_type", v as EventType)}
              >
                <SelectTrigger className="h-11 rounded-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-semibold">Статус</Label>
              <Select
                defaultValue={editEvent?.status ?? "planned"}
                onValueChange={(v) => setValue("status", v as EventStatus)}
              >
                <SelectTrigger className="h-11 rounded-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(EVENT_STATUS_LABELS) as [EventStatus, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Начало</Label>
              <Input
                {...register("start_at")}
                type="datetime-local"
                disabled={watchAllDay}
                className="h-11 rounded-[12px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Конец</Label>
              <Input
                {...register("end_at")}
                type="datetime-local"
                disabled={watchAllDay}
                className="h-11 rounded-[12px]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("all_day")} className="rounded" />
            <span className="text-sm font-semibold">Весь день</span>
          </label>

          <div className="space-y-1">
            <Label className="text-sm font-semibold">Место</Label>
            <Input {...register("location")} className="h-11 rounded-[12px]" placeholder="Адрес или ссылка" />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-semibold">Описание</Label>
            <Textarea {...register("description")} className="rounded-[12px] resize-none" rows={2} placeholder="Описание..." />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-primary text-primary-foreground font-bold"
            >
              {isSubmitting ? "Сохраняем..." : isEdit ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
