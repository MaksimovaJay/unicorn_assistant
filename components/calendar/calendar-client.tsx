"use client";

import dynamic from "next/dynamic";

const CalendarView = dynamic(
  () => import("@/components/calendar/calendar-view").then((m) => m.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4">
        <div className="h-8 bg-muted rounded-full animate-pulse w-96" />
        <div className="h-[600px] bg-muted rounded-[20px] animate-pulse" />
      </div>
    ),
  }
);

export function CalendarClient() {
  return <CalendarView />;
}
