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

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Календарь</h1>
        <p className="text-muted-foreground text-sm font-semibold mt-1">
          Все события и встречи
        </p>
      </div>
      <CalendarView />
    </div>
  );
}
