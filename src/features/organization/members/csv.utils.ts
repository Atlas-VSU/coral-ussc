import { toast } from "sonner";
import { CSVTemplateColumn } from "./types";

/**
 * CSV Template Configuration for Bulk Member Import.
 * This constant defines the structure, rules, and sample data for the import template.
 * It is the single source of truth for CSV generation and validation.
 */
const CSV_TEMPLATE_COLUMNS: CSVTemplateColumn[] = [
  {
    name: "studentId",
    label: "Student ID",
    description: "The unique ID number for the student.",
    required: true,
    example: "20-1-01701",
  },
  {
    name: "firstName",
    label: "First Name",
    description: "The student's given name.",
    required: true,
    example: "John",
  },
  {
    name: "lastName",
    label: "Last Name",
    description: "The student's family name.",
    required: true,
    example: "Doe",
  },
  {
    name: "email",
    label: "Email",
    description: "The student's primary email address.",
    required: true,
    example: "john.doe@example.com",
  },
  {
    name: "programId",
    label: "Program Name",
    description: 'The full program name (e.g., "BS in Computer Science").',
    required: true,
    example: "BS in Computer Science",
  },
  {
    name: "facultyId",
    label: "Faculty Name",
    description: 'The full faculty name (e.g., "Faculty of Computing").',
    required: true,
    example: "Faculty of Computing",
  },
  {
    name: "yearLevel",
    label: "Year Level",
    description: "The student's year level (1-5). This field is optional.",
    required: false,
    example: "3",
  },
];

const SAMPLE_TEMPLATE_DATA = [
  {
    studentId: "20-1-01701",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@example.com",
    programId: "BS in Information Technology",
    facultyId: "Faculty of Computing",
    yearLevel: "3",
  },
  {
    studentId: "19-1-01234",
    firstName: "Peter",
    lastName: "Jones",
    email: "peter.jones@example.com",
    programId: "BS in Computer Science",
    facultyId: "Faculty of Computing",
    yearLevel: "4",
  },
];

/**
 * Escapes a value for CSV, handling commas, quotes, and newlines.
 * @param value The value to escape.
 * @returns A CSV-safe string.
 */
const escapeCSVValue = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  // If the value contains a comma, a newline, or a double quote, wrap it in double quotes.
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    // Also, any double quotes within the value must be escaped by another double quote.
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Generates the full CSV content string with headers and optional sample data.
 * @param includeSampleData - Whether to include sample rows for user guidance.
 * @returns The complete CSV content as a string.
 */
const generateCSVContent = (includeSampleData: boolean = true): string => {
  // Use the descriptive 'label' for the CSV header row
  const headerLabels = CSV_TEMPLATE_COLUMNS.map((col) => col.label);
  const headerRow = headerLabels.map(escapeCSVValue).join(","); // Escape labels just in case

  let csvContent = headerRow + "\n";

  if (includeSampleData) {
    // Use the machine-readable 'name' to map the sample data keys
    const headerNames = CSV_TEMPLATE_COLUMNS.map((col) => col.name);

    SAMPLE_TEMPLATE_DATA.forEach((row) => {
      const rowValues = headerNames.map((headerName) => {
        const value = row[headerName as keyof typeof row];
        return escapeCSVValue(value);
      });
      csvContent += rowValues.join(",") + "\n";
    });
  }

  return csvContent;
};

/**
 * Generates and triggers the download of a CSV template file.
 * This is the primary export for initiating a download from a UI component.
 */
export const downloadCSVTemplate = (): void => {
  try {
    const csvContent = generateCSVContent(true);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, "");
    const filename = `students_import_template_${timestamp}.csv`;

    // Create a temporary link to trigger the download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (error) {
      console.error("Error downloading CSV template:", error);
      toast.error("Failed to download CSV template");
  }
};

/**
 * Returns the template column definitions for displaying in the UI.
 * @returns A copy of the column information array.
 */
export const getTemplateColumnInfo = (): CSVTemplateColumn[] => {
  // Return a copy to prevent accidental mutation of the original constant.
  return [...CSV_TEMPLATE_COLUMNS];
};

/**
 * Validates an array of headers from an uploaded CSV file.
 * @param uploadedHeaders - An array of header strings from the user's file.
 * @returns An object detailing the validity and any missing or extra headers.
 */
export const validateCSVHeaders = (
  uploadedHeaders: string[]
): {
  isValid: boolean;
  missingRequired: string[];
} => {
  const requiredHeaders = CSV_TEMPLATE_COLUMNS.filter(
    (col) => col.required
  ).map((col) => col.name);

  const missingRequired = requiredHeaders.filter(
    (header) => !uploadedHeaders.includes(header)
  );

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
  };
};
