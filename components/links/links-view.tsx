"use client";

import { useState } from "react";
import { ExternalLink, Trash2, Plus, Link2 } from "lucide-react";
import { useLinks, useDeleteLink } from "@/hooks/use-links";
import { LinkDialog } from "@/components/links/link-dialog";
import { Button } from "@/components/ui/button";

export function LinksView() {
  const { data: links = [], isLoading } = useLinks();
  const deleteLink = useDeleteLink();
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Удалить ссылку "${title}"?`)) return;
    await deleteLink.mutateAsync(id);
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-[16px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="group relative bg-surface rounded-[16px] shadow-card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex flex-col gap-1 min-w-0"
            >
              <div className="flex items-center gap-2">
                <ExternalLink size={14} className="text-primary flex-shrink-0" />
                <span className="font-bold text-sm text-foreground truncate">{link.title}</span>
              </div>
              <span className="text-xs text-muted-foreground truncate">{link.url}</span>
            </a>

            <button
              onClick={() => handleDelete(link.id, link.title)}
              className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        <button
          onClick={() => setDialogOpen(true)}
          className="h-24 border-2 border-dashed border-border rounded-[16px] flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus size={20} />
          <span className="text-xs font-semibold">Добавить</span>
        </button>

        {links.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Link2 size={32} className="opacity-30" />
            <p className="text-sm font-semibold">Пока нет ссылок</p>
          </div>
        )}
      </div>

      <LinkDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
