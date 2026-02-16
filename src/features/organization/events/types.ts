// Event status type
export type EventStatus = "ongoing" | "upcoming" | "archived" | "completed";

// Event type
export type Event = {
  id: number;
  name: string;
  date: string;
  majorEvent?: boolean;
  timeInStart?: string | null;
  timeInEnd?: string | null;
  timeOutStart?: string | null;
  timeOutEnd?: string | null;
  location: string;
  note: string | "";
  attendees: number;
  status: EventStatus;
  facultyId?: string; // Faculty ID to associate event with creating faculty
  programId?: string; // Program ID to associate event with a specific program
};
