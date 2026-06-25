import { TodayEvents } from "@/components/dashboard/today-events";

function todayLabel(): string {
  const d = new Date();
  const date = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const weekday = d.toLocaleDateString("ru-RU", { weekday: "long" });
  return `${date}, ${weekday}`;
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-black text-text-primary">Сегодня</h1>
        <span className="text-sm text-muted-foreground capitalize">{todayLabel()}</span>
      </div>
      <TodayEvents />
    </div>
  );
}
