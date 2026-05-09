import { CalendarBoard } from "./Calendar";
import { SectionHeader } from "./ui";

export const CalendarPage = () => {
  return (
    <div className="fade-in">
      <SectionHeader
        title="Calendar"
        subtitle="All bookings, meetings, lessons and appointments — across the whole business."
      />
      <div className="rounded-2xl bg-card hairline overflow-hidden">
        <CalendarBoard />
      </div>
    </div>
  );
};
