import { LinksView } from "@/components/links/links-view";

export default function LinksPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Ссылки</h1>
        <p className="hidden md:block text-muted-foreground text-sm font-semibold mt-1">
          Быстрый доступ к нужным сайтам
        </p>
      </div>
      <LinksView />
    </div>
  );
}
