import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const LINKS_KEY = ["links"] as const;

export interface Link {
  id: string;
  workspace_id: string;
  title: string;
  url: string;
  created_by: string | null;
  created_at: string;
}

export function useLinks() {
  return useQuery({
    queryKey: LINKS_KEY,
    queryFn: async () => {
      const res = await fetch("/api/links");
      if (!res.ok) throw new Error("Failed to fetch links");
      return res.json() as Promise<Link[]>;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; url: string }) => {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Link>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LINKS_KEY }),
  });
}

export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LINKS_KEY }),
  });
}
