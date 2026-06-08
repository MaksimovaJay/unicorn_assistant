import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🦄</div>
          <h1 className="text-2xl font-black text-foreground">Unicorn Assistant</h1>
          <p className="text-muted-foreground text-sm mt-1 font-semibold">
            Рабочее пространство
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
