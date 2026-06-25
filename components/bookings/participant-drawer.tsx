"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, ExternalLink, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useUpdateParticipant, useDeleteParticipant, useUploadReceipt } from "@/hooks/use-bookings";
import type { BookingParticipant } from "@/types/database";

function telegramHref(value: string): string {
  if (!value.trim()) return "";
  if (value.startsWith("http")) return value;
  return `https://t.me/${value.replace(/^@/, "")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface Props {
  participant: BookingParticipant;
  groupId: string;
  onClose: () => void;
  onUpdate: (updated: BookingParticipant) => void;
}

export function ParticipantDrawer({ participant: p, groupId, onClose, onUpdate }: Props) {
  const update = useUpdateParticipant(groupId);
  const del = useDeleteParticipant(groupId);
  const uploadReceipt = useUploadReceipt(groupId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [telegram, setTelegram] = useState(p.telegram ?? "");

  useEffect(() => {
    setTelegram(p.telegram ?? "");
  }, [p.id, p.updated_at]);

  async function handleSave() {
    const result = await update.mutateAsync({ id: p.id, telegram: telegram.trim() || null });
    onUpdate(result);
  }

  async function handleDelete() {
    if (!confirm(`Удалить участника "${p.full_name}"?`)) return;
    await del.mutateAsync(p.id);
    onClose();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadReceipt.mutateAsync({ id: p.id, file });
    onUpdate({ ...p, receipt_url: result.url });
  }

  const tgHref = telegramHref(telegram);

  return (
    <div className="w-[300px] flex-shrink-0 bg-surface border-l border-border flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border flex items-start justify-between gap-2">
        <p className="text-base font-bold text-text-primary leading-snug">{p.full_name}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground flex-shrink-0 mt-0.5"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Telegram */}
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Telegram
          </Label>
          <div className="flex items-center gap-2">
            <Input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@username или ссылка"
              className="h-8 text-sm flex-1"
            />
            <a
              href={tgHref || undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Открыть в Telegram"
              className={cn(
                "p-1.5 rounded-lg transition-colors flex-shrink-0",
                tgHref
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground/30 pointer-events-none"
              )}
            >
              <Send size={15} />
            </a>
          </div>
        </div>

        {/* Phone */}
        {p.phone && (
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Телефон
            </Label>
            <a href={`tel:${p.phone}`} className="block text-sm text-primary hover:underline">
              {p.phone}
            </a>
          </div>
        )}

        {/* Email */}
        {p.email && (
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Email
            </Label>
            <a href={`mailto:${p.email}`} className="block text-sm text-primary hover:underline">
              {p.email}
            </a>
          </div>
        )}

        {/* Payment */}
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Оплата
          </Label>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
              p.payment_status === "paid"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            )}
          >
            {p.payment_status === "paid" ? "Оплачено" : "Не оплачено"}
          </span>
          {p.payment_date && (
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(p.payment_date)}</p>
          )}
        </div>

        {/* Booked */}
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Место
          </Label>
          <p className="text-sm text-text-primary">
            {p.booked ? "Забронировано" : "Не забронировано"}
          </p>
        </div>

        {/* Receipt */}
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Чек
          </Label>
          {p.receipt_url ? (
            <a
              href={p.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
            >
              <ExternalLink size={13} /> Открыть чек
            </a>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadReceipt.isPending}
                className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                <Upload size={13} />
                {uploadReceipt.isPending ? "Загрузка..." : "Загрузить чек"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFile}
              />
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-red-200 text-red-500 hover:bg-red-50 mr-auto"
          onClick={handleDelete}
          disabled={del.isPending}
        >
          Удалить
        </Button>
        <Button
          size="sm"
          className="text-xs"
          onClick={handleSave}
          disabled={update.isPending}
        >
          {update.isPending ? "..." : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}
