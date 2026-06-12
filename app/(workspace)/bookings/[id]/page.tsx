"use client";

import { useState } from "react";
import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlotsTab } from "@/components/bookings/slots-tab";
import { ParticipantsTab } from "@/components/bookings/participants-tab";
import { useSessions } from "@/hooks/use-bookings";

const TABS = [
  { id: "slots", label: "Слоты" },
  { id: "participants", label: "Участники" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  params: Promise<{ id: string }>;
}

export default function SessionDetailPage({ params }: Props) {
  const { id } = use(params);
  const [tab, setTab] = useState<TabId>("slots");
  const { data: sessions = [] } = useSessions();
  const session = sessions.find((s) => s.id === id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/bookings" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-text-primary">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-text-primary">{session?.title ?? "Мероприятие"}</h1>
          {session?.session_date && (
            <p className="text-sm text-text-secondary">
              {new Date(session.session_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-muted/60 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
              tab === t.id ? "bg-background text-text-primary shadow-sm" : "text-muted-foreground hover:text-text-primary"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "slots" ? <SlotsTab sessionId={id} /> : <ParticipantsTab sessionId={id} />}
    </div>
  );
}
