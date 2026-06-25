"use client";

import { useMutation } from "@tanstack/react-query";

interface CreateContactInput {
  full_name: string;
  telegram?: string;
  phone?: string;
  email?: string;
}

async function createContactFn(input: CreateContactInput): Promise<unknown> {
  const res = await fetch("/api/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useCreateContact() {
  return useMutation({ mutationFn: createContactFn });
}
