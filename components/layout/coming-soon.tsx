import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-[20px] bg-primary/10 flex items-center justify-center mb-4">
        <Icon size={32} className="text-primary" />
      </div>
      <h2 className="text-2xl font-extrabold text-text-primary mb-2">{title}</h2>
      <p className="text-text-secondary text-sm max-w-xs font-semibold">{description}</p>
      <div className="mt-4 px-4 py-2 bg-accent/20 rounded-full text-xs font-bold text-text-secondary">
        Скоро
      </div>
    </div>
  );
}
