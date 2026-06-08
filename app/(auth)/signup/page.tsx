"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (signupError) {
      setError("Не удалось зарегистрироваться. Проверьте данные и попробуйте снова.");
      setLoading(false);
      return;
    }

    if (data.user) {
      const res = await fetch("/api/setup-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, workspaceName: "Unicorn Assistant" }),
      });

      if (!res.ok) {
        console.error("Workspace setup failed, will retry on dashboard load");
        // Don't block — auth user exists, workspace will be set up on next load
      }
    }

    window.location.href = "/dashboard";
  }

  return (
    <Card className="rounded-[20px] shadow-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-extrabold text-foreground">
          Создать аккаунт
        </CardTitle>
        <CardDescription className="text-muted-foreground font-semibold">
          Зарегистрируйтесь в рабочем пространстве
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-semibold text-sm">
              Имя
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              required
              className="h-11 rounded-[12px] border-border focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-semibold text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-11 rounded-[12px] border-border focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-semibold text-sm">
              Пароль
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              minLength={8}
              required
              className="h-11 rounded-[12px] border-border focus-visible:ring-primary"
            />
          </div>

          {error && (
            <p role="alert" className="text-destructive text-sm font-semibold">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all"
          >
            {loading ? "Создаём..." : "Зарегистрироваться"}
          </Button>

          <p className="text-center text-sm text-muted-foreground font-semibold">
            Уже есть аккаунт?{" "}
            <Link
              href="/login"
              className="text-primary font-bold hover:underline"
            >
              Войти
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
