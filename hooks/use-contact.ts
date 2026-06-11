import { useQuery } from "@tanstack/react-query";
import type { Contact } from "@/types/database";

export function useContact(id: string | null) {
  return useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) return null;
      return res.json() as Promise<Contact>;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}
