"use client";

import { useState, useRef } from "react";
import { Trash2, Upload, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateParticipant, useDeleteParticipant, useUploadReceipt } from "@/hooks/use-bookings";
import type { BookingParticipant, ContactChannel } from "@/types/database";

interface Props {
  participant: BookingParticipant;
  groupId: string;
}

export function ParticipantRow({ participant: p, groupId }: Props) {
  const update = useUpdateParticipant(groupId);
  const del = useDeleteParticipant(groupId);
  const uploadReceipt = useUploadReceipt(groupId);
  const fileRef = useRef<HTMLInputElement>(null);

  function blur(field: string, value: unknown) {
    update.mutate({ id: p.id, [field]: value });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadReceipt.mutateAsync({ id: p.id, file });
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-3 py-2 min-w-[130px]">
        <Input
          defaultValue={p.full_name}
          onBlur={(e) => blur("full_name", e.target.value)}
          className="h-8 text-sm border-transparent hover:border-border focus:border-border"
          placeholder="ФИО"
        />
      </td>
      <td className="px-3 py-2 min-w-[150px]">
        <Input
          defaultValue={p.email ?? ""}
          onBlur={(e) => blur("email", e.target.value || null)}
          className="h-8 text-sm border-transparent hover:border-border focus:border-border"
          placeholder="email"
        />
      </td>
      <td className="px-3 py-2 min-w-[130px]">
        <Input
          defaultValue={p.phone ?? ""}
          onBlur={(e) => blur("phone", e.target.value || null)}
          className="h-8 text-sm border-transparent hover:border-border focus:border-border"
          placeholder="+7..."
        />
      </td>
      <td className="px-3 py-2 min-w-[130px]">
        <Select defaultValue={p.payment_status} onValueChange={(v) => blur("payment_status", v)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">Оплачено</SelectItem>
            <SelectItem value="unpaid">Не оплачено</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2 min-w-[100px]">
        <Select defaultValue={p.booked ? "yes" : "no"} onValueChange={(v) => blur("booked", v === "yes")}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Да</SelectItem>
            <SelectItem value="no">Нет</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2 min-w-[140px]">
        <Input
          type="date"
          defaultValue={p.payment_date ?? ""}
          onBlur={(e) => blur("payment_date", e.target.value || null)}
          className="h-8 text-sm border-transparent hover:border-border focus:border-border"
        />
      </td>
      <td className="px-3 py-2 min-w-[130px]">
        <Select defaultValue={p.contact_channel ?? ""} onValueChange={(v) => blur("contact_channel", v as ContactChannel || null)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="other">Другое</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2 min-w-[80px] text-center">
        {p.receipt_url ? (
          <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary text-xs hover:underline">
            <ExternalLink size={12} /> Чек
          </a>
        ) : (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadReceipt.isPending}
              className="inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-primary transition-colors"
            >
              <Upload size={12} /> {uploadReceipt.isPending ? "..." : "Загрузить"}
            </button>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
          </>
        )}
      </td>
      <td className="px-3 py-2">
        <button
          onClick={() => del.mutate(p.id)}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}
