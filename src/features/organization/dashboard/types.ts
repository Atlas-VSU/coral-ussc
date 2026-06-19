import { EventStatus } from "../events/types";

export type Event = {
  id: string;
  fineTypeId: string;
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
  finesGenerated?: boolean;
  academicYear?: string;
  semester?: string;
};
