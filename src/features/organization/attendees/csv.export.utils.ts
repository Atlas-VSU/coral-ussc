/**
 * Attendance Export System
 * 
 * This module provides functionality to export event attendance data to CSV format.
 * The exported CSV includes event information and attendee details with their check-in/out times.
 * 
 * CSV Format:
 * Row 1: Event Name
 * Row 2: Column Headers (Student ID, Last Name, First Name, Program ID, Time In, Time Out)
 * Row 3+: Attendance data
 * 
 * Example CSV:
 * "Annual Tech Conference 2024"
 * Student ID,Last Name,First Name,Program ID,Time In,Time Out
 * 20-1-01701,Doe,John,"BS in Computer Science","9:30 AM","5:00 PM"
 */

import { 
  collection, 
  query, 
  where, 
  getDocs
} from "firebase/firestore";
import { db } from "../../../firebase/firebase.config";
import { EventAttendance } from "../log-attendance/types";
import { Event } from "../events/types";
import { getEventById } from "../../../firebase/events";
import { getProgramById } from "../../../firebase/programs";

// Interface for enriched attendance data with resolved names
interface EnrichedAttendanceData {
  studentId: string;
  lastName: string;
  firstName: string;
  programName: string;    // Resolved program name
  timeIn: string;         // Formatted time string
  timeOut: string;        // Formatted time string
}

// Interface for export result
export interface AttendanceExportResult {
  success: boolean;
  csvContent?: string;
  eventName?: string;
  totalRecords?: number;
  error?: string;
}

/**
 * Formats a timestamp to a readable time string for CSV export
 * @param timestamp - The timestamp to format (Date object, string, or null)
 * @returns Formatted time string (e.g., "9:30 AM") or "Not recorded"
 */
const formatTimeForExport = (timestamp: Date | string | null): string => {
  if (!timestamp) return "Not recorded";
  
  try {
    // Handle both Date objects and string timestamps
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid time";
    
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    
    return `${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return "Invalid time";
  }
};

/**
 * Escapes CSV values to handle commas, quotes, and newlines
 * @param value - The value to escape
 * @returns Escaped CSV value wrapped in quotes if necessary
 */
const escapeCsvValue = (value: string): string => {
  if (!value) return '';
  
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
};

/**
 * Fetches all attendance records for a specific event
 * @param eventId - The ID of the event to fetch attendance for
 * @returns Array of EventAttendance records sorted by student name
 */
const fetchEventAttendance = async (eventId: string): Promise<EventAttendance[]> => {
  try {
    const attendanceCollection = collection(db, "eventAttendees");
    
    // Query for all attendance records for the specific event
    // Using simple query without orderBy to avoid index requirements
    const attendanceQuery = query(
      attendanceCollection,
      where("eventId", "==", eventId)
    );
    
    const querySnapshot = await getDocs(attendanceQuery);
    
    // Map Firestore documents to EventAttendance objects
    const attendanceRecords: EventAttendance[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        eventId: data.eventId,
        student: data.student,
        timeIn: data.timeIn?.toDate() || null,   // Convert Firestore Timestamp to Date
        timeOut: data.timeOut?.toDate() || null  // Convert Firestore Timestamp to Date
      } as EventAttendance;
    });
    
    // Sort the results client-side to avoid Firestore index requirements
    attendanceRecords.sort((a, b) => {
      const nameA = `${a.student.firstName} ${a.student.lastName}`.toLowerCase();
      const nameB = `${b.student.firstName} ${b.student.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    return attendanceRecords;
  } catch (error) {
    console.error("Error fetching event attendance:", error);
    throw new Error("Failed to fetch attendance records from database");
  }
};

/**
 * Resolves program names from their IDs
 * Uses caching to minimize Firebase calls for repeated IDs
 * @param attendanceRecords - Array of attendance records to enrich
 * @returns Array of enriched attendance data with resolved names
 */
const enrichAttendanceData = async (attendanceRecords: EventAttendance[]): Promise<EnrichedAttendanceData[]> => {
  // Create cache to avoid duplicate Firebase calls
  const programCache = new Map<string, string>();
  
  const enrichedData: EnrichedAttendanceData[] = [];
  
  for (const record of attendanceRecords) {
    const { student, timeIn, timeOut } = record;
    
    // Resolve program name (with caching)
    let programName = "Unknown Program";
    if (student.programId) {
      if (programCache.has(student.programId)) {
        programName = programCache.get(student.programId)!;
      } else {
        try {
          const program = await getProgramById(student.programId);
          programName = program?.name || "Unknown Program";
          programCache.set(student.programId, programName);
        } catch (error) {
          console.error(`Error fetching program ${student.programId}:`, error);
          programCache.set(student.programId, "Unknown Program");
        }
      }
    }
    
    // Create enriched data record
    enrichedData.push({
      studentId: student.studentId || "N/A",
      lastName: student.lastName || "N/A",
      firstName: student.firstName || "N/A",
      programName,
      timeIn: formatTimeForExport(timeIn),
      timeOut: formatTimeForExport(timeOut)
    });
  }
  
  return enrichedData;
};

/**
 * Generates CSV content from enriched attendance data
 * @param eventName - Name of the event (for first row)
 * @param enrichedData - Array of enriched attendance data
 * @returns CSV content as string
 */
const generateCsvContent = (eventName: string, enrichedData: EnrichedAttendanceData[]): string => {
  // Row 1: Event name (escaped for CSV)
  const csvLines: string[] = [escapeCsvValue(eventName)];
  
  // Row 2: Column headers
  const headers = [
    'Student ID',
    'Last Name',
    'First Name',
    'Program ID',  // Note: Column name is programId but contains program name
    'Time In',
    'Time Out'
  ];
  csvLines.push(headers.join(','));
  
  // Row 3+: Attendance data
  enrichedData.forEach(record => {
    const row = [
      escapeCsvValue(record.studentId),
      escapeCsvValue(record.lastName),
      escapeCsvValue(record.firstName),
      escapeCsvValue(record.programName),   // Program name in programId column
      escapeCsvValue(record.timeIn),
      escapeCsvValue(record.timeOut)
    ];
    csvLines.push(row.join(','));
  });
  
  return csvLines.join('\n');
};

/**
 * Main function to export event attendance data
 * This is the primary entry point for attendance export functionality
 * @param eventId - The ID of the event to export attendance for
 * @returns Complete export result with CSV content and metadata
 */
export const exportEventAttendance = async (eventId: string): Promise<AttendanceExportResult> => {
  try {
    // Step 1: Fetch event details to get event name
    const event = await getEventById(eventId) as Event;
    if (!event) {
      return {
        success: false,
        error: "Event not found"
      };
    }
    
    // Step 2: Fetch all attendance records for the event
    const attendanceRecords = await fetchEventAttendance(eventId);
    
    if (attendanceRecords.length === 0) {
      return {
        success: false,
        error: "No attendance records found for this event"
      };
    }
    
    // Step 3: Enrich attendance data with resolved program and faculty names
    const enrichedData = await enrichAttendanceData(attendanceRecords);
    
    // Step 4: Generate CSV content
    const csvContent = generateCsvContent(event.name, enrichedData);
    
    return {
      success: true,
      csvContent,
      eventName: event.name, // Pass event name for filename generation
      totalRecords: enrichedData.length
    };
    
  } catch (error) {
    console.error("Error exporting event attendance:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred during export"
    };
  }
};

/**
 * Utility function to trigger browser download of CSV content
 * This function should be called from the frontend to download the exported data
 * Automatically generates a timestamped filename for consistency
 * @param csvContent - The CSV content to download
 * @param eventName - The name of the event (optional, for filename generation)
 */
export const downloadCsvFile = (csvContent: string, eventName?: string): void => {
  try {
    // Generate filename automatically with timestamp
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
    
    let filename = `attendance_export_${timestamp}.csv`;
    
    // If event name is provided, include it in filename
    if (eventName) {
      const sanitizedEventName = eventName
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .trim()
        .toLowerCase();
      
      filename = `${sanitizedEventName}_attendance_${timestamp}.csv`;
    }
    
    // Create blob with CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download URL
    const url = window.URL.createObjectURL(blob);
    
    // Create temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading CSV file:', error);
    throw new Error('Failed to download CSV file');
  }
};
