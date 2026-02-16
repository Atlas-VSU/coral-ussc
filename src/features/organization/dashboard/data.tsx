export const studentStats = {
  totalStudents: 256,
  totalAbsences: 47,
  attendanceRate: 94.2, // percentage
};

export const eventAttendance = [
  {
    eventName: "Day 1 Morning Intramurals",
    date: "2025-07-15",
    present: 242,
    absent: 14,
  },
  {
    eventName: "Day 1 Afternoon Competitions",
    date: "2025-07-15",
    present: 235,
    absent: 21,
  },
  {
    eventName: "Day 2 Cultural Show",
    date: "2025-07-16",
    present: 250,
    absent: 6,
  },
  {
    eventName: "Day 3 Morning Intramurals",
    date: "2025-07-17",
    present: 228,
    absent: 28,
  },
];

export const upcomingEvents = [
  {
    id: 1,
    title: "Day 4 Sports Finals",
    date: "2025-07-18",
    status: "upcoming",
    location: "University Gymnasium",
    timeIn: {
      start: "08:00",
      end: "09:00",
    },
    timeOut: {
      start: "16:00",
      end: "17:00",
    },
    attendees: 0,
  },
  {
    id: 2,
    title: "Closing Ceremony",
    date: "2025-07-19",
    status: "upcoming",
    location: "University Auditorium",
    timeIn: {
      start: "13:00",
      end: "13:30",
    },
    timeOut: {
      start: "15:30",
      end: "16:00",
    },
    attendees: 0,
  },
];

export const ongoingEvents = [
  {
    id: 3,
    title: "Day 3 Morning Intramurals",
    date: "2025-07-17",
    status: "ongoing",
    location: "Science Building",
    timeIn: {
      start: "09:00",
      end: "10:00",
    },
    timeOut: null, // Example of event with only time-in
    attendees: 228,
  },
];

export const recentMembers = [
  {
    id: 1,
    name: "John Rhuel Laurente",
    email: "rhuel.laurente@example.com",
    imageUrl: "https://i.pravatar.cc/150?img=1",
    dateJoined: "2025-07-10",
    course: "BS Computer Science",
  },
  {
    id: 2,
    name: "Xyryll Jay Taneo",
    email: "xyryll.taneo@example.com",
    imageUrl: "https://i.pravatar.cc/150?img=2",
    dateJoined: "2025-07-09",
    course: "BS Information Technology",
  },
  {
    id: 3,
    name: "Jamir Andrade",
    email: "jamer.andrade@example.com",
    imageUrl: "https://i.pravatar.cc/150?img=3",
    dateJoined: "2025-07-08",
    course: "BS Engineering",
  },
  {
    id: 4,
    name: "Keith Valdeo",
    email: "keith.valdeo@example.com",
    imageUrl: "https://i.pravatar.cc/150?img=4",
    dateJoined: "2025-07-07",
    course: "BS Psychology",
  },
];
