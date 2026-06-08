import { LayoutDashboard } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function DashboardPage() {
  return (
    <ComingSoon
      icon={LayoutDashboard}
      title="Dashboard"
      description="Обзор событий, задач и платежей на сегодня"
    />
  );
}
