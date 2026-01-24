import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";

export default function CalendarFC({
  initialView = "dayGridMonth",
  events = [],
  height = "auto",
  onDateClick,
  onEventClick,
}) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
      initialView={initialView}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
      }}
      locale="es"
      firstDay={1}
      height={height}
      selectable={true}
      nowIndicator={true}
      events={events}
      dateClick={onDateClick}
      eventClick={onEventClick}
    />
  );
}