import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateSelectArg } from "@fullcalendar/interaction";
import { EventClickArg } from "@fullcalendar/core";
import { VacationEntry, UserInfo } from "../types";
import { useVacations } from "../hooks/useVacations";
import VacationForm from "./VacationForm";

interface Props {
  currentUser: UserInfo;
}

interface FormState {
  initialStart?: string;
  initialEnd?: string;
  editEntry?: VacationEntry;
}

// Safe date shift using local time — avoids UTC timezone offset issues (e.g. KST UTC+9)
function shiftDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d + days); // local time, no UTC conversion
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function VacationCalendar({ currentUser }: Props) {
  const { vacations, loading, error, addVacation, updateVacation, deleteVacation } =
    useVacations();
  const [form, setForm] = useState<FormState | null>(null);

  const leaveLabel: Record<string, string> = {
    연차: "",
    반차오전: " (오전)",
    반차오후: " (오후)",
  };

  const events = vacations.map((v) => ({
    id: v.id,
    title: v.userDisplayName + (leaveLabel[v.leaveType] ?? "") + (v.note ? ` · ${v.note}` : ""),
    start: v.startDate,
    end: shiftDate(v.endDate, 1), // FullCalendar end is exclusive
    backgroundColor: v.color,
    borderColor: v.color,
    opacity: v.leaveType !== "연차" ? 0.65 : 1,
    extendedProps: { vacation: v },
  }));

  const handleSelect = (info: DateSelectArg) => {
    setForm({
      initialStart: info.startStr,
      initialEnd: shiftDate(info.endStr, -1), // FullCalendar end is exclusive → make inclusive
    });
  };

  const handleEventClick = (info: EventClickArg) => {
    const vacation = info.event.extendedProps.vacation as VacationEntry;
    setForm({ editEntry: vacation });
  };

  if (loading) return <div className="calendar-loading">로딩 중...</div>;
  if (error) return <div className="calendar-error">데이터를 불러오지 못했습니다: {error}</div>;

  return (
    <div className="calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ko"
        height="100%"
        selectable
        selectMirror
        dayMaxEvents={3}
        events={events}
        select={handleSelect}
        eventClick={handleEventClick}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        buttonText={{ today: "오늘" }}
      />
      {form && (
        <VacationForm
          currentUser={currentUser}
          initialStart={form.initialStart}
          initialEnd={form.initialEnd}
          editEntry={form.editEntry}
          onSave={addVacation}
          onUpdate={updateVacation}
          onDelete={deleteVacation}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
