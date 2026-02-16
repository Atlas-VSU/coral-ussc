// export function formatTime(time: string | null) {
//   if (!time) return null;

//   const [hours, minutes] = time.split(":");
//   const hour = parseInt(hours, 10);
//   const ampm = hour >= 12 ? "PM" : "AM";
//   const formattedHour = hour % 12 || 12;

//   return `${formattedHour}:${minutes} ${ampm}`;
// }

// export function formatTimeRange(timeRange: TimeRange) {
//   if (!timeRange) return null;
//   return `${formatTime(timeRange.start)} - ${formatTime(timeRange.end)}`;
// }

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

export function formatTimeRange(
  timeStart: string | null,
  timeOutStart: string | null
) {
  if (!timeStart || !timeOutStart) return null;
  return `${formatTime(timeStart)} - ${formatTime(timeOutStart)}`;
}

const formatTime = (time: string | null) => {
  if (!time) return null;

  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${minutes} ${ampm}`;
};

export function isValidStudentId(studentId: string): boolean {
  const pattern = /^\d{2}-\d{1}-\d{5}$/;
  return pattern.test(studentId);
}
