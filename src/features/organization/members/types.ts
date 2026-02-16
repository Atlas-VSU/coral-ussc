import { Timestamp } from "firebase/firestore";

export type Member = {
  firstName: string;
  lastName: string;
  programId: string;
  facultyId?: string;
  studentId: string;
  email: string;
  role: "admin" | "user" | "super-admin";
  accessLevel?: number;
  createdAt?: Timestamp;
  yearLevel?: number; // Adding year level
};

export type Program = {
  id: string;
  name: string;
  facultyId?: string;
  code?: string; // Program code like "BSCS", "BSES", "BSCE"
};

export type Faculty = {
  id: string;
  name: string;
  code?: string; // Faculty code like "FC", "FFES", "FE"
};

export type MemberData = {
  id: string;
  member: Member;
};


// Interface for raw CSV row data before validation
// Includes rowNumber for error reporting and optional fields since CSV parsing may have missing values
export interface RawMemberData {
  rowNumber: number;           // Track original CSV row for error reporting
  studentId?: string;          // Optional because validation will check for required fields
  firstName?: string;
  lastName?: string;
  email?: string;
  programId?: string;          // Contains full program name (e.g., "BS in Computer Science")
  facultyId?: string;          // Contains full faculty name (e.g., "Faculty of Computing")
  yearLevel?: string | number; // Can be string from CSV or number after parsing
  [key: string]: unknown;      // Allow additional CSV columns that we don't explicitly handle
}

// Interface for reference data cache to improve performance
// This prevents multiple Firebase calls during batch processing
export interface ReferenceDataCache {
  faculties: Map<string, Faculty>;  // Map faculty NAME to faculty object (e.g., "Faculty of Computing" -> {id: "doc_id", name: "Faculty of Computing"})
  programs: Map<string, Program>;   // Map program NAME to program object (e.g., "BS in Computer Science" -> {id: "doc_id", name: "BS in Computer Science"})
}


// Interface for bulk import result - provides comprehensive feedback to the UI
export interface BulkImportResult {
  success: boolean;                    // Overall operation success status
  totalProcessed: number;              // Total number of rows attempted to process
  successfulImports: number;           // Number of members successfully added to database
  errors: Array<{                     // Detailed error information for failed rows
    row: number;                       // Original CSV row number for easy reference
    studentId: string;                 // Student ID from the failed row (or 'N/A' if missing)
    error: string;                     // Human-readable error description
  }>;
  duplicates: string[];                // List of student IDs that already exist in database
}

// Interface for validated member data that passed all validation checks
// Extends Member interface but includes rowNumber for tracking during processing
export interface ValidatedMemberData extends Member {
  rowNumber: number;                   // Keep track of original CSV row for error reporting
}

/**
 * Defines the structure for a column in the CSV template.
 * Used for generating headers, providing UI descriptions, and validation.
 */
export interface CSVTemplateColumn {
  name: string; // The machine-readable column header name (e.g., 'studentId').
  label: string; // The human-readable name for UI display (e.g., 'Student ID').
  description: string; // A helpful description of the field for the user.
  required: boolean; // Whether this field is mandatory for import.
  example: string; // Sample data to demonstrate the expected format.
}
