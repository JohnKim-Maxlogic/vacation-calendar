export type LeaveType = "연차" | "반차오전" | "반차오후";

export interface VacationEntry {
  id: string;
  userId: string;
  userDisplayName: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD" (inclusive)
  leaveType: LeaveType;
  note?: string;
  color: string;
}
