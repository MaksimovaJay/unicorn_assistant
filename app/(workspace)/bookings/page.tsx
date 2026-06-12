import { SessionsList } from "@/components/bookings/sessions-list";

export default function BookingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <SessionsList />
    </div>
  );
}
