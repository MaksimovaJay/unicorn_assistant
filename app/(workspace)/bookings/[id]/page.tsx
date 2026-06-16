"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { ChevronLeft, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlotsTab } from "@/components/bookings/slots-tab";
import { ParticipantsTab } from "@/components/bookings/participants-tab";
import { InlineEdit } from "@/components/ui/inline-edit";
import { useSessions, useUpdateSession } from "@/hooks/use-bookings";

type TabId = "slots" | "participants";

const ALL_TABS: { id: TabId; label: string }[] = [
  { id: "slots", label: "Слоты" },
  { id: "participants", label: "Участники" },
];

const LS_KEY = "booking-tab-order";

function loadOrder(): TabId[] {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as TabId[];
      if (parsed.length === 2 && parsed.includes("slots") && parsed.includes("participants")) {
        return parsed;
      }
    }
  } catch {}
  return ["slots", "participants"];
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function SessionDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data: sessions = [] } = useSessions();
  const session = sessions.find((s) => s.id === id);
  const updateSession = useUpdateSession();

  const [tabOrder, setTabOrder] = useState<TabId[]>(["slots", "participants"]);
  const [tab, setTab] = useState<TabId>("slots");

  useEffect(() => {
    const order = loadOrder();
    setTabOrder(order);
    setTab(order[0]);
  }, []);

  function swapTabs() {
    const newOrder: TabId[] = [tabOrder[1], tabOrder[0]];
    setTabOrder(newOrder);
    setTab(newOrder[0]);
    localStorage.setItem(LS_KEY, JSON.stringify(newOrder));
  }

  const tabs = tabOrder.map((tid) => ALL_TABS.find((t) => t.id === tid)!);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/bookings" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-text-primary">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-text-primary">
            {session ? (
              <InlineEdit
                value={session.title}
                onSave={(title) => updateSession.mutate({ id, title })}
                className="text-2xl font-black"
                inputClassName="text-2xl font-black"
                placeholder="Название мероприятия"
              />
            ) : "Мероприятие"}
          </h1>
          {session?.session_date && (
            <p className="text-sm text-text-secondary">
              {new Date(session.session_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1 bg-muted/60 p-1 rounded-xl">
          {tabs.map((t) => (
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
        <button
          onClick={swapTabs}
          title="Поменять порядок вкладок"
          className="p-2 rounded-xl text-muted-foreground hover:text-text-primary hover:bg-muted transition-colors"
        >
          <ArrowLeftRight size={16} />
        </button>
      </div>

      {tab === "slots" ? <SlotsTab sessionId={id} /> : <ParticipantsTab sessionId={id} />}
    </div>
  );
}
