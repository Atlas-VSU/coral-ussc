/**
 * Bulk Import System for Student Members
 *
 * This module provides functionality to bulk import student members from CSV files.
 * The system validates CSV data against Firebase reference data to ensure data integrity.
 *
 * Expected CSV Format:
 * Student ID,First Name,Last Name,Email,Program Name,Faculty Name,Year Level
 *
 * Student ID format: XX-1-XXXXX (where X is a number from 0-9, e.g., "21-1-12345")
 * Faculty Name values should match the full names in the 'faculties' collection (e.g., "Faculty of Computing", "Faculty of Engineering")
 * Program Name values should match the full names in the 'programs' collection (e.g., "BS in Computer Science", "BS in Environmental Science")
 *
 * Example CSV row:
 * 21-1-12345,John,Doe,john.doe@example.com,"BS in Computer Science","Faculty of Computing",3
 *
 * The system automatically:
 * - Validates all required fields
 * - Checks faculty and program names against Firebase data
 * - Prevents duplicate student IDs
 * - Provides detailed error reporting for failed imports
 * - Uses efficient batch operations for database writes
 */

import {
  collection,
  writeBatch,
  Timestamp,
  query,
  where,
  getDocs,
  CollectionReference,
  DocumentData,
  doc,
} from "firebase/firestore";
import { db } from "./firebase.config";
import {
  Faculty,
  Program,
  ReferenceDataCache,
  RawMemberData,
  BulkImportResult,
  ValidatedMemberData,
} from "@/features/organization/members/types";
import { getFaculties } from "./faculties";
import { getPrograms } from "./programs";

// Define the collection reference for reuse across all functions
// This prevents creating the collection reference multiple times
const usersCollection: CollectionReference<DocumentData> = collection(
  db,
  "users"
);

// Centralized error handler for consistent error logging and messaging
const handleFirestoreError = (error: unknown, context: string) => {
  console.error(`Error ${context}:`, error);
  throw new Error(`Failed to ${context}.`);
};

// Global cache for reference data (faculties and programs)
// This will be populated once per bulk import operation
let referenceCache: ReferenceDataCache | null = null;

/**
 * Loads and caches faculty and program reference data from Firebase
 * This function ensures we only fetch reference data once per bulk import operation
 * @returns Promise that resolves to the cached reference data
 */
const loadReferenceData = async (): Promise<ReferenceDataCache> => {
  // Return cached data if already loaded
  if (referenceCache) {
    return referenceCache;
  }

  try {
    // Fetch faculties and programs in parallel for efficiency
    const [facultiesData, programsData] = await Promise.all([
      getFaculties(),
      getPrograms(),
    ]);

    // Create Maps for O(1) lookup performance during validation
    const facultiesMap = new Map<string, Faculty>();
    const programsMap = new Map<string, Program>();

    // Populate faculty map using the name field for direct matching
    if (facultiesData) {
      (facultiesData as Faculty[]).forEach((faculty) => {
        // Map by the name field (e.g., "Faculty of Computing", "Faculty of Engineering")
        facultiesMap.set(faculty.name, faculty);
      });
    }

    // Populate program map using the name field for direct matching
    if (programsData) {
      (programsData as Program[]).forEach((program) => {
        // Map by the name field (e.g., "BS in Computer Science", "BS in Environmental Science")
        programsMap.set(program.name, program);
      });
    }

    // Cache the reference data for reuse
    referenceCache = {
      faculties: facultiesMap,
      programs: programsMap,
    };

    return referenceCache;
  } catch (error) {
    handleFirestoreError(error, "load reference data (faculties and programs)");
    // Return empty cache on error to prevent crashes
    return {
      faculties: new Map(),
      programs: new Map(),
    };
  }
};

/**
 * Clears the reference data cache
 * Should be called after bulk import completion to free memory
 */
const clearReferenceCache = (): void => {
  referenceCache = null;
};

/**
 * Gets available faculty and program options for CSV template generation
 * This function can be used by the UI to show users what values are acceptable
 * @returns Object containing available faculties and programs with their IDs and names
 */
export const getAvailableReferenceData = async (): Promise<{
  faculties: Faculty[];
  programs: Program[];
}> => {
  try {
    const referenceData = await loadReferenceData();

    return {
      faculties: Array.from(referenceData.faculties.values()),
      programs: Array.from(referenceData.programs.values()),
    };
  } catch (error) {
    handleFirestoreError(error, "get available reference data");
    return {
      faculties: [],
      programs: [],
    };
  }
};

/**
 * Validates required fields for a member record from CSV data
 * Performs comprehensive validation including format checks for email and year level
 * Also validates that facultyId and programId exist in the Firebase reference data
 * @param data - Raw member data from CSV parsing
 * @param referenceData - Cached faculty and program reference data for validation
 * @returns Array of error messages (empty if validation passes)
 */
const validateMemberData = async (data: RawMemberData): Promise<string[]> => {
  const errors: string[] = [];

  // Load reference data for faculty and program validation
  const referenceData = await loadReferenceData();

  // Check required string fields and ensure they're not empty after trimming
  if (!data.studentId || data.studentId.trim() === "") {
    errors.push("Student ID is required");
  } else {
    // Validate Student ID format: XX-1-XXXXX (where X can be any number from 0-9)
    const studentIdRegex = /^[0-9]{2}-1-[0-9]{5}$/;
    if (!studentIdRegex.test(data.studentId.trim())) {
      errors.push("Student ID must be in format XX-1-XXXXX (where X is a number from 0-9)");
    }
  }

  if (!data.firstName || data.firstName.trim() === "") {
    errors.push("First name is required");
  }

  if (!data.lastName || data.lastName.trim() === "") {
    errors.push("Last name is required");
  }

  // Email validation: check if exists and validate format
  if (!data.email || data.email.trim() === "") {
    errors.push("Email is required");
  } else {
    // Basic email validation using regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Invalid email format");
    }
  }

  // Faculty name validation: check if required and exists in reference data
  if (!data.facultyId || data.facultyId.trim() === "") {
    errors.push("Faculty ID is required");
  } else {
    const facultyName = data.facultyId.trim(); // facultyId contains the full name
    if (!referenceData.faculties.has(facultyName)) {
      const availableFaculties = Array.from(
        referenceData.faculties.keys()
      ).join(", ");
      errors.push(
        `Invalid Faculty name "${facultyName}". Available faculties: ${
          availableFaculties || "None found"
        }`
      );
    }
  }

  // Program name validation: check if required and exists in reference data
  if (!data.programId || data.programId.trim() === "") {
    errors.push("Program ID is required");
  } else {
    const programName = data.programId.trim(); // programId contains the full name
    if (!referenceData.programs.has(programName)) {
      const availablePrograms = Array.from(referenceData.programs.keys()).join(
        ", "
      );
      errors.push(
        `Invalid Program name "${programName}". Available programs: ${
          availablePrograms || "None found"
        }`
      );
    }
  }

  // Validate year level if provided (optional field)
  if (data.yearLevel !== undefined && 
      data.yearLevel !== null && 
      data.yearLevel !== "" && 
      (typeof data.yearLevel === "string" ? data.yearLevel.trim() !== "" : true)) {
    // Handle both string and number inputs from CSV
    const yearLevel =
      typeof data.yearLevel === "string"
        ? parseInt(data.yearLevel.trim())
        : Number(data.yearLevel);
    if (isNaN(yearLevel) || yearLevel < 1) {
      errors.push("Year level must be a positive integer");
    }
  }

  return errors;
};

/**
 * Checks for duplicate student IDs within the CSV data itself
 * This prevents processing CSV files that contain internal duplicates
 * @param memberData - Array of parsed member data from CSV
 * @returns Object containing duplicate information and cleaned data
 */
const checkInternalDuplicates = (memberData: RawMemberData[]): {
  duplicates: Array<{ studentId: string; rows: number[] }>;
  uniqueMembers: RawMemberData[];
} => {
  const studentIdMap = new Map<string, number[]>();
  const duplicates: Array<{ studentId: string; rows: number[] }> = [];
  const uniqueMembers: RawMemberData[] = [];

  // Track all student IDs and their row numbers
  memberData.forEach((member) => {
    const studentId = (member.studentId as string)?.trim();
    if (studentId) {
      if (!studentIdMap.has(studentId)) {
        studentIdMap.set(studentId, []);
      }
      studentIdMap.get(studentId)!.push(member.rowNumber);
    }
  });

  // Identify duplicates and keep only the first occurrence
  const processedIds = new Set<string>();
  
  memberData.forEach((member) => {
    const studentId = (member.studentId as string)?.trim();
    if (studentId) {
      const rowNumbers = studentIdMap.get(studentId) || [];
      
      // If this student ID appears multiple times, it's a duplicate
      if (rowNumbers.length > 1) {
        // Only add to duplicates array once per student ID
        if (!processedIds.has(studentId)) {
          duplicates.push({
            studentId,
            rows: rowNumbers,
          });
          processedIds.add(studentId);
        }
        
        // Keep only the first occurrence (earliest row number)
        if (member.rowNumber === Math.min(...rowNumbers)) {
          uniqueMembers.push(member);
        }
        // Skip subsequent occurrences
      } else {
        // Unique student ID, include it
        uniqueMembers.push(member);
      }
    } else {
      // Include members without student IDs (they'll be caught by validation)
      uniqueMembers.push(member);
    }
  });

  return { duplicates, uniqueMembers };
};

/**
 * Checks for existing student IDs in the database to prevent duplicates
 * Uses batched queries due to Firestore's 'in' operator limit of 10 items per query
 * @param studentIds - Array of student IDs to check
 * @returns Array of student IDs that already exist in the database
 */
const checkExistingStudentIds = async (
  studentIds: string[]
): Promise<string[]> => {
  try {
    const existingIds: string[] = [];

    // batch by 10 due to query limitations ahahahaha
    const batchSize = 10;
    for (let i = 0; i < studentIds.length; i += batchSize) {
      const batch = studentIds.slice(i, i + batchSize);

      // Query for existing student IDs in this batch
      const q = query(
        usersCollection,
        where("studentId", "in", batch), // Check if studentId exists in current batch
        where("isDeleted", "==", false) // Only check non-deleted records
      );

      const querySnapshot = await getDocs(q);
      // Extract student IDs from the found documents
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        existingIds.push(data.studentId);
      });
    }

    return existingIds;
  } catch (error) {
    handleFirestoreError(error, "check existing student IDs");
    return [];
  }
};

/**
 * Parses CSV content and returns array of member data
 * Handles CSV format validation, header verification, and data extraction
 * @param csvContent - Raw CSV file content as string
 * @returns Array of parsed member data with row numbers for error tracking
 */
export const parseCSVContent = (csvContent: string): RawMemberData[] => {
  // Split content into lines and remove any trailing whitespace
  const lines = csvContent.trim().split("\n");

  // Ensure minimum required structure (header + at least one data row)
  if (lines.length < 2) {
    throw new Error(
      "CSV file must contain at least a header row and one data row"
    );
  }

  // Get headers and normalize them (remove quotes, trim whitespace)
  // This handles CSV files that may have quoted headers
  const headers = lines[0]
    .split(",")
    .map((header) => header.trim().replace(/^["']|["']$/g, ""));

  // Validate that all required headers are present
  const requiredHeaders = [
    "Student ID",
    "First Name",
    "Last Name",
    "Email",
    "Program Name",
    "Faculty Name",
  ];
  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
  }

  // Parse data rows starting from index 1 (skipping header row)
  const members: RawMemberData[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Skip completely empty lines
    if (lines[i].trim() === "") continue;

    // Split row into values and clean them (remove quotes, trim)
    const values = lines[i]
      .split(",")
      .map((value) => value.trim().replace(/^["']|["']$/g, ""));

    // Validate that row has correct number of columns
    if (values.length !== headers.length) {
      throw new Error(
        `Row ${i + 1}: Number of values (${
          values.length
        }) doesn't match number of headers (${headers.length})`
      );
    }

    // Create member data object with row tracking
    const memberData: RawMemberData = { rowNumber: i + 1 }; // i + 1 gives actual CSV row number

    // Create a mapping from user-friendly headers to internal field names
    const headerMapping: { [key: string]: string } = {
      "Student ID": "studentId",
      "First Name": "firstName",
      "Last Name": "lastName",
      Email: "email",
      "Program Name": "programId",
      "Faculty Name": "facultyId",
      "Year Level": "yearLevel", // Optional field
    };

    // Map each value to its corresponding internal field name
    headers.forEach((header, index) => {
      const internalFieldName = headerMapping[header] || header; // Fallback to original header if not mapped
      memberData[internalFieldName] = values[index] || null; // Use null for empty values
    });

    members.push(memberData);
  }

  return members;
};

/**
 * Main function to bulk import users from parsed data
 * Handles validation, duplicate checking, and batch writing to Firestore
 * @param memberData - Array of parsed member data from CSV
 * @returns Comprehensive result object with success status and detailed feedback
 */
export const bulkImportUsers = async (
  memberData: RawMemberData[]
): Promise<BulkImportResult> => {
  // Initialize result object to track the entire operation
  const result: BulkImportResult = {
    success: false,
    totalProcessed: memberData.length,
    successfulImports: 0,
    errors: [],
    duplicates: [],
  };

  try {
    // Step 1: Load reference data once for all validations
    const referenceData = await loadReferenceData();

    // Step 1.5: Check for internal duplicates within the CSV file itself
    const { duplicates: internalDuplicates, uniqueMembers } = checkInternalDuplicates(memberData);
    
    // Add internal duplicate errors to the result
    internalDuplicates.forEach((duplicate) => {
      // Skip the first occurrence (it will be processed), add errors for subsequent ones
      const [firstRow, ...duplicateRows] = duplicate.rows;
      duplicateRows.forEach((row) => {
        result.errors.push({
          row: row,
          studentId: duplicate.studentId,
          error: `Duplicate Student ID in CSV file. First occurrence at row ${firstRow}`,
        });
      });
    });

    // Use the unique members list for processing (duplicates removed)
    const memberDataToProcess = uniqueMembers;

    // Step 2: Validate all member data before attempting any database operations
    const validatedMembers: ValidatedMemberData[] = [];

    for (const data of memberDataToProcess) {
      // Run validation on current row (now async due to reference data loading)
      const validationErrors = await validateMemberData(data);

      // If validation fails, add to errors and skip this record
      if (validationErrors.length > 0) {
        result.errors.push({
          row: data.rowNumber,
          studentId: (data.studentId as string) || "N/A",
          error: validationErrors.join(", "),
        });
        continue; // Skip to next record
      }

      // Create validated member object with proper typing and data cleaning
      const validatedMember: ValidatedMemberData = {
        rowNumber: data.rowNumber,
        studentId: (data.studentId as string).trim(),
        firstName: (data.firstName as string).trim(),
        lastName: (data.lastName as string).trim(),
        email: (data.email as string).trim().toLowerCase(), // Normalize email to lowercase
        // Look up the document ID using the full name from CSV (stored in programId/facultyId fields)
        programId:
          referenceData.programs.get((data.programId as string).trim())?.id ||
          "",
        facultyId:
          referenceData.faculties.get((data.facultyId as string).trim())?.id ||
          "",
        role: "user", // Default role for bulk imported members
        yearLevel: (data.yearLevel !== undefined && 
                   data.yearLevel !== null && 
                   data.yearLevel !== "" && 
                   (typeof data.yearLevel === "string" ? data.yearLevel.trim() !== "" : true))
          ? typeof data.yearLevel === "string"
            ? parseInt(data.yearLevel.trim())
            : Number(data.yearLevel)
          : 0, // Default to 0 when not provided, matching addUser function behavior
      };

      validatedMembers.push(validatedMember);
    }

    // Early exit if no valid members to process
    if (validatedMembers.length === 0) {
      result.success = false;
      // Clear cache before returning
      clearReferenceCache();
      return result;
    }

    // Step 3: Check for existing student IDs to prevent duplicates with database
    const studentIds = validatedMembers.map((member) => member.studentId);
    const existingStudentIds = await checkExistingStudentIds(studentIds);

    // Filter out duplicates and track them for reporting
    const membersToImport = validatedMembers.filter((member) => {
      if (existingStudentIds.includes(member.studentId)) {
        result.duplicates.push(member.studentId);
        return false; // Don't import this member
      }
      return true; // Import this member
    });

    // If all members were duplicates, return success but with zero imports
    if (membersToImport.length === 0) {
      result.success = true; // No errors, but all were duplicates
      // Clear cache before returning
      clearReferenceCache();
      return result;
    }

    // Step 4: Batch write to Firestore for efficiency
    // Using batch writes ensures atomicity - either all succeed or all fail
    const batch = writeBatch(db);
    const timestamp = Timestamp.now(); // Single timestamp for all records

    membersToImport.forEach((member) => {
      // Generate new document reference for each member
      const docRef = doc(collection(db, "users"));

      // Prepare member data for database storage
      const memberDataForSave = {
        ...member,
        createdAt: timestamp, // Add creation timestamp
        isDeleted: false, // Default soft delete flag
      };

      // Remove rowNumber before saving to database (it's only for error tracking)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rowNumber, ...memberDataWithoutRow } = memberDataForSave;

      // Add this document creation to the batch
      batch.set(docRef, memberDataWithoutRow);
    });

    // Execute the batch write - this is atomic (all or nothing)
    await batch.commit();

    // Update result with success information
    result.successfulImports = membersToImport.length;
    result.success = true;

    // Clear reference cache to free memory after successful import
    clearReferenceCache();

    return result;
  } catch (error) {
    // Handle any unexpected errors during the bulk import process
    // Clear cache even on error to prevent memory leaks
    clearReferenceCache();
    handleFirestoreError(error, "bulk import users");
    result.success = false;
    return result;
  }
};

/**
 * Main function to handle file upload and bulk import
 * This is the primary entry point for the bulk import feature
 * Validates file type, reads content, parses CSV, and processes the import
 * @param file - The uploaded File object from the user
 * @returns Complete import result with success status and detailed feedback
 */
export const processFileForBulkImport = async (
  file: File
): Promise<BulkImportResult> => {
  try {
    // Validate file type to ensure it's a CSV file
    const validTypes = ["text/csv", "application/vnd.ms-excel"];
    const validExtensions = [".csv"];

    // Check both MIME type and file extension for better compatibility
    const hasValidType =
      validTypes.includes(file.type) ||
      validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidType) {
      throw new Error("Invalid file type. Please upload a CSV file.");
    }

    // Read file content as text
    const fileContent = await file.text();

    // Parse CSV content into structured data
    const memberData = parseCSVContent(fileContent);

    // Process the bulk import with parsed data
    return await bulkImportUsers(memberData);
  } catch (error) {
    // Return error result if any step fails
    return {
      success: false,
      totalProcessed: 0,
      successfulImports: 0,
      errors: [
        {
          row: 0, // Row 0 indicates a file-level error
          studentId: "N/A",
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      ],
      duplicates: [],
    };
  }
};
