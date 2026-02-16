/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Event {
  id: string;
  name: string;
  date: string | Date;
  location: string;
  status: "ongoing" | "upcoming" | "completed" | "cancelled";
  timeInStart: string | null;
  timeInEnd: string | null;
  timeOutStart: string | null;
  timeOutEnd: string | null;
  attendees?: number;
  majorEvent?: boolean;
  createdAt?: any; // For Timestamp objects
  isDeleted?: boolean;
  note?: string;
  facultyId?: string; // Faculty ID to associate event with creating faculty
}
