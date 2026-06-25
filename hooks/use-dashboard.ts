"use client";

import { useQuery } from "@tanstack/react-query";
import type { Event } from "@/types/database";

async function fetchTodayEvents(): Promise<Event[]> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useTodayEvents() {
  return useQuery({
    queryKey: ["dashboard", "events"],
    queryFn: fetchTodayEvents,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
