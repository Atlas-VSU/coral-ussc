// export type StudentBasicInfo = {
//   studentId: string;
//   name: string;
//   email: string;
// };

// export type AttendanceRecord = {
//   id: string;
//   eventId: number;
//   student: StudentBasicInfo;
//   timestamp: string;
//   type: "time-in" | "time-out";
// };

export type Event = {
  id: number;
  name: string;
  date: string;
  timeIn: { start: string; end: string } | null;
  timeOut: { start: string; end: string } | null;
  location: string;
  note: string;
  attendees: number;
  status: "upcoming" | "ongoing" | "completed" | "archived";
  isMajor?: boolean;
};

// // Mock student data
// const students: StudentBasicInfo[] = [
//   {
//     studentId: "20-1-01701",
//     name: "John Rhuel Laurente",
//     email: "john.laurente@example.com",
//   },
//   {
//     studentId: "20-1-01702",
//     name: "Xyryll Jay Taneo",
//     email: "xyryll.taneo@example.com",
//   },
//   {
//     studentId: "20-1-01703",
//     name: "Jamir Andrade",
//     email: "jamir.andrade@example.com",
//   },
//   {
//     studentId: "20-1-01704",
//     name: "Keith Valdeo",
//     email: "keith.valdeo@example.com",
//   },
//   {
//     studentId: "21-2-01705",
//     name: "Maria Santos",
//     email: "maria.santos@example.com",
//   },
//   {
//     studentId: "21-2-01706",
//     name: "Carlos Reyes",
//     email: "carlos.reyes@example.com",
//   },
//   {
//     studentId: "22-1-01707",
//     name: "Sofia Garcia",
//     email: "sofia.garcia@example.com",
//   },
//   {
//     studentId: "22-1-01708",
//     name: "Miguel Lopez",
//     email: "miguel.lopez@example.com",
//   },
// ];

// // Mock events data (copy of relevant events for this feature)
// const mockEvents: Event[] = [
//   {
//     id: 4,
//     name: "Day 3 Academic Quiz Bee",
//     date: "2025-07-17",
//     timeIn: {
//       start: "09:00",
//       end: "10:00",
//     },
//     timeOut: null,
//     location: "Science Building",
//     note: "Participants should arrive 30 minutes early",
//     attendees: 228,
//     status: "ongoing",
//     isMajor: true,
//   },
//   {
//     id: 5,
//     name: "Day 4 Sports Finals",
//     date: "2025-07-18",
//     timeIn: {
//       start: "08:00",
//       end: "09:00",
//     },
//     timeOut: {
//       start: "16:00",
//       end: "17:00",
//     },
//     location: "University Stadium",
//     note: "Bring water and proper sports attire",
//     attendees: 0,
//     status: "upcoming",
//   },
//   {
//     id: 6,
//     name: "Closing Ceremony",
//     date: "2025-07-19",
//     timeIn: {
//       start: "13:00",
//       end: "13:30",
//     },
//     timeOut: {
//       start: "15:30",
//       end: "16:00",
//     },
//     location: "University Auditorium",
//     note: "Formal attire required",
//     attendees: 0,
//     status: "upcoming",
//   },
// ];

// // Mock attendance records
// const attendanceRecords: AttendanceRecord[] = [
//   {
//     id: "att-001",
//     eventId: 4,
//     student: students[0],
//     timestamp: "2025-07-17T09:15:32",
//     type: "time-in",
//   },
//   {
//     id: "att-002",
//     eventId: 4,
//     student: students[1],
//     timestamp: "2025-07-17T09:17:45",
//     type: "time-in",
//   },
//   {
//     id: "att-003",
//     eventId: 4,
//     student: students[2],
//     timestamp: "2025-07-17T09:22:10",
//     type: "time-in",
//   },
//   {
//     id: "att-004",
//     eventId: 4,
//     student: students[3],
//     timestamp: "2025-07-17T09:25:03",
//     type: "time-in",
//   },
//   {
//     id: "att-005",
//     eventId: 4,
//     student: students[4],
//     timestamp: "2025-07-17T09:28:17",
//     type: "time-in",
//   },
// ];

// // Function to get event by ID (now local to this file)
// export function getEventById(eventId: number): Event | undefined {
//   return mockEvents.find((event) => event.id === eventId);
// }

// // Functions to interact with the mock data
// export function findStudentById(studentId: string): StudentBasicInfo | null {
//   return students.find((student) => student.studentId === studentId) || null;
// }

// export function findStudentsByName(name: string): StudentBasicInfo[] {
//   if (!name.trim()) return [];

//   const searchTerm = name.toLowerCase();
//   return students.filter((student) =>
//     student.name.toLowerCase().includes(searchTerm)
//   );
// }

// export async function addStudent(
//   studentData: StudentBasicInfo
// ): Promise<StudentBasicInfo> {
//   // In a real app, this would make an API call
//   const newStudent = {
//     studentId: studentData.studentId,
//     name: studentData.name,
//     email: studentData.email,
//   };

//   // Add to our mock data
//   students.push(newStudent);

//   return newStudent;
// }

// export function isValidStudentId(studentId: string): boolean {
//   const pattern = /^\d{2}-\d{1}-\d{5}$/;
//   return pattern.test(studentId);
// }

// export async function logAttendance({
//   eventId,
//   studentId,
//   type,
// }: {
//   eventId: number;
//   studentId: string;
//   type: "time-in" | "time-out";
// }): Promise<AttendanceRecord> {
//   const student = findStudentById(studentId);

//   if (!student) {
//     throw new Error("Student not found");
//   }

//   const newRecord: AttendanceRecord = {
//     id: `att-${Math.floor(Math.random() * 10000)}`,
//     eventId,
//     student,
//     timestamp: new Date().toISOString(),
//     type,
//   };

//   // Add to our mock data
//   attendanceRecords.unshift(newRecord);

//   return newRecord;
// }

// export function getRecentAttendance(
//   eventId: number,
//   type: "time-in" | "time-out"
// ): AttendanceRecord[] {
//   return attendanceRecords
//     .filter((record) => record.eventId === eventId && record.type === type)
//     .sort(
//       (a, b) =>
//         new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
//     )
//     .slice(0, 10); // Get the 10 most recent records
// }
