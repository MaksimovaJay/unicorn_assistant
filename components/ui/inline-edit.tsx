"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}

export function InlineEdit({ value, onSave, className, inputClassName, placeholder }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className={cn(
          "bg-transparent border-b border-primary outline-none w-full",
          inputClassName
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span className={cn("group inline-flex items-center gap-1", className)}>
      <span>
        {value || <span className="text-muted-foreground italic">{placeholder}</span>}
      </span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true); }}
        aria-label="Редактировать"
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded text-muted-foreground flex-shrink-0"
      >
        <Pencil size={13} />
      </button>
    </span>
  );
}
