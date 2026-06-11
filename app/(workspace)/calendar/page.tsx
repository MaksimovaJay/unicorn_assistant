import { CalendarClient } from "@/components/calendar/calendar-client";

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Календарь</h1>
        <p className="hidden md:block text-muted-foreground text-sm font-semibold mt-1">
          Все события и встречи
        </p>
      </div>
      <CalendarClient />
    </div>
  );
}
