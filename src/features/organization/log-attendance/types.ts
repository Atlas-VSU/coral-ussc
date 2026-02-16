import { Member } from "../members/types";


export type AttendanceRecord = {
  id: string;
  eventId: number;
  student: Member;
  timestamp: string;
  type: "time-in" | "time-out";
};

export type EventAttendance = {
  id: string;
  eventId: number;
  userId: string;
  student: Member;
  timeIn: string;
  timeOut: string;
  remark: "registered in different program" | "registered in different faculty" | null;
  status: "present" | "absent" | "partially absent";
};