"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BookingSession, BookingSlot, BookingGroup, BookingParticipant } from "@/types/database";

// ─── Sessions ──────────────────────────────────────────────────────────────

async function fetchSessions(): Promise<BookingSession[]> {
  const res = await fetch("/api/bookings/sessions");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useSessions() {
  return useQuery({ queryKey: ["booking-sessions"], queryFn: fetchSessions, staleTime: 60_000, refetchOnWindowFocus: false });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { title: string; session_date: string }) => {
      const res = await fetch("/api/bookings/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<BookingSession>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-sessions"] }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookings/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-sessions"] }),
  });
}

// ─── Slots ─────────────────────────────────────────────────────────────────

async function fetchSlots(sessionId: string): Promise<BookingSlot[]> {
  const res = await fetch(`/api/bookings/sessions/${sessionId}/slots`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useSlots(sessionId: string) {
  return useQuery({ queryKey: ["booking-slots", sessionId], queryFn: () => fetchSlots(sessionId), staleTime: 60_000, refetchOnWindowFocus: false });
}

export function useCreateSlot(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { slot_time: string }) => {
      const res = await fetch(`/api/bookings/sessions/${sessionId}/slots`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<BookingSlot>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-slots", sessionId] }),
  });
}

export function useUpdateSlot(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<BookingSlot> & { id: string }) => {
      const res = await fetch(`/api/bookings/slots/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<BookingSlot>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-slots", sessionId] }),
  });
}

export function useDeleteSlot(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookings/slots/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-slots", sessionId] }),
  });
}

// ─── Groups ────────────────────────────────────────────────────────────────

async function fetchGroups(sessionId: string): Promise<BookingGroup[]> {
  const res = await fetch(`/api/bookings/sessions/${sessionId}/groups`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useGroups(sessionId: string) {
  return useQuery({ queryKey: ["booking-groups", sessionId], queryFn: () => fetchGroups(sessionId), staleTime: 60_000, refetchOnWindowFocus: false });
}

export function useCreateGroup(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; position?: number }) => {
      const res = await fetch(`/api/bookings/sessions/${sessionId}/groups`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<BookingGroup>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-groups", sessionId] }),
  });
}

export function useDeleteGroup(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookings/groups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-groups", sessionId] }),
  });
}

// ─── Participants ──────────────────────────────────────────────────────────

async function fetchParticipants(groupId: string): Promise<BookingParticipant[]> {
  const res = await fetch(`/api/bookings/groups/${groupId}/participants`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useParticipants(groupId: string) {
  return useQuery({ queryKey: ["booking-participants", groupId], queryFn: () => fetchParticipants(groupId), staleTime: 60_000, refetchOnWindowFocus: false });
}

export function useCreateParticipant(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Omit<BookingParticipant, "id" | "group_id" | "receipt_url" | "created_at" | "updated_at">) => {
      const res = await fetch(`/api/bookings/groups/${groupId}/participants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<BookingParticipant>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-participants", groupId] }),
  });
}

export function useUpdateParticipant(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<BookingParticipant> & { id: string }) => {
      const res = await fetch(`/api/bookings/participants/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<BookingParticipant>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-participants", groupId] }),
  });
}

export function useDeleteParticipant(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookings/participants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-participants", groupId] }),
  });
}

export function useUploadReceipt(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/bookings/participants/${id}/receipt`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-participants", groupId] }),
  });
}
