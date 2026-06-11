"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateLink } from "@/hooks/use-links";

const schema = z.object({
  title: z.string().min(1, "Введи название"),
  url: z.string().url("Введи корректную ссылку"),
});

type FormValues = z.infer<typeof schema>;

interface LinkDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LinkDialog({ open, onClose }: LinkDialogProps) {
  const createLink = useCreateLink();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
  });

  async function onSubmit(values: FormValues) {
    await createLink.mutateAsync(values);
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm rounded-[20px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Новая ссылка</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Название</Label>
            <Input {...register("title")} autoFocus className="h-11 rounded-[12px]" placeholder="Например: Notion" />
            {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-semibold">Ссылка</Label>
            <Input {...register("url")} className="h-11 rounded-[12px]" placeholder="https://..." />
            {errors.url && <p className="text-destructive text-xs">{errors.url.message}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="rounded-full">
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-primary text-primary-foreground font-bold"
            >
              {isSubmitting ? "Сохраняем..." : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
