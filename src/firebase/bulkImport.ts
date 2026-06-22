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
  Member,
} from "@/features/organization/members/types";
import { getFaculties } from "./faculties";
import { getPrograms } from "./programs";
import { parseCSVRow } from "@/features/organization/members/csv.utils";
import { addStudentWithClearance } from "./clearance";
import { getCurrentUserData } from "./users";

const usersCollection: CollectionReference<DocumentData> = collection(
  db,
  "users"
);

const handleFirestoreError = (error: unknown, context: string) => {
  console.error(`Error ${context}:`, error);
  throw new Error(`Failed to ${context}.`);
};

let referenceCache: ReferenceDataCache | null = null;

const loadReferenceData = async (): Promise<ReferenceDataCache> => {
  if (referenceCache) {
    return referenceCache;
  }

  try {
    const [facultiesData, programsData] = await Promise.all([
      getFaculties(),
      getPrograms(),
    ]);

    const facultiesMap = new Map<string, Faculty>();
    const programsMap = new Map<string, Program>();

    if (facultiesData) {
      (facultiesData as Faculty[]).forEach((faculty) => {
        facultiesMap.set(faculty.name, faculty);
        facultiesMap.set(faculty.acronym, faculty);
      });
    }

    if (programsData) {
      (programsData as Program[]).forEach((program) => {
        programsMap.set(program.name, program);
        programsMap.set(program.acronym, program);
      });
    }

    referenceCache = {
      faculties: facultiesMap,
      programs: programsMap,
    };

    return referenceCache;
  } catch (error) {
    handleFirestoreError(error, "load reference data (faculties and programs)");
    return {
      faculties: new Map(),
      programs: new Map(),
    };
  }
};

const clearReferenceCache = (): void => {
  referenceCache = null;
};

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

const validateMemberData = async (data: RawMemberData): Promise<string[]> => {
  const errors: string[] = [];

  const referenceData = await loadReferenceData();

  if (!data.studentId || data.studentId.trim() === "") {
    errors.push("Student ID is required");
  } else {
    const studentIdRegex = /^[0-9]{2}-[0-9]{1}-[0-9]{5}$/;
    if (!studentIdRegex.test(data.studentId.trim())) {
      errors.push("Student ID must be in format XX-X-XXXXX (where X is a number from 0-9)");
    }
  }

  if (!data.firstName || data.firstName.trim() === "") {
    errors.push("First name is required");
  }

  if (!data.lastName || data.lastName.trim() === "") {
    errors.push("Last name is required");
  }

  if (!data.email || data.email.trim() === "") {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Invalid email format");
    }
  }

  if (!data.facultyId || data.facultyId.trim() === "") {
    errors.push("Faculty Name is required");
  } else {
    const facultyName = data.facultyId.trim(); 
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

  if (!data.programId || data.programId.trim() === "") {
    errors.push("Program name is required");
  } else {
    const programName = data.programId.trim(); 
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

  if (data.yearLevel !== undefined && 
      data.yearLevel !== null && 
      data.yearLevel !== "" && 
      (typeof data.yearLevel === "string" ? data.yearLevel.trim() !== "" : true)) {
    const yearLevel =
      typeof data.yearLevel === "string"
        ? parseInt(data.yearLevel.trim())
        : Number(data.yearLevel);
    if (yearLevel < 1) {
      errors.push("Year level must be a positive integer");
    }
  }

  return errors;
};

const checkInternalDuplicates = (memberData: RawMemberData[]): {
  duplicates: Array<{ studentId: string; rows: number[] }>;
  uniqueMembers: RawMemberData[];
} => {
  const studentIdMap = new Map<string, number[]>();
  const duplicates: Array<{ studentId: string; rows: number[] }> = [];
  const uniqueMembers: RawMemberData[] = [];

  memberData.forEach((member) => {
    const studentId = (member.studentId as string)?.trim();
    if (studentId) {
      if (!studentIdMap.has(studentId)) {
        studentIdMap.set(studentId, []);
      }
      studentIdMap.get(studentId)!.push(member.rowNumber);
    }
  });

  const processedIds = new Set<string>();
  
  memberData.forEach((member) => {
    const studentId = (member.studentId as string)?.trim();
    if (studentId) {
      const rowNumbers = studentIdMap.get(studentId) || [];
      
      if (rowNumbers.length > 1) {
        if (!processedIds.has(studentId)) {
          duplicates.push({
            studentId,
            rows: rowNumbers,
          });
          processedIds.add(studentId);
        }
        
        if (member.rowNumber === Math.min(...rowNumbers)) {
          uniqueMembers.push(member);
        }
      } else {
        uniqueMembers.push(member);
      }
    } else {
      uniqueMembers.push(member);
    }
  });

  return { duplicates, uniqueMembers };
};

const checkExistingStudentIds = async (
  studentIds: string[]
): Promise<string[]> => {
  try {
    const existingIds: string[] = [];

    const batchSize = 10;
    for (let i = 0; i < studentIds.length; i += batchSize) {
      const batch = studentIds.slice(i, i + batchSize);
      const q = query(
        usersCollection,
        where("studentId", "in", batch), 
        where("isDeleted", "==", false) 
      );

      const querySnapshot = await getDocs(q);
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

export const parseCSVContent = (csvContent: string): RawMemberData[] => {
  const lines = csvContent.trim().split("\n");

  if (lines.length < 2) {
    throw new Error(
      "CSV file must contain at least a header row and one data row"
    );
  }

  const headers = parseCSVRow(lines[0]);

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

  const members: RawMemberData[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue;

    const values = parseCSVRow(lines[i]);

    if (values.length !== headers.length) {
      throw new Error(
        `Row ${i + 1}: Number of values (${
          values.length
        }) doesn't match number of headers (${headers.length})`
      );
    }

    const memberData: RawMemberData = { rowNumber: i + 1 }; 

    const headerMapping: { [key: string]: string } = {
      "Student ID": "studentId",
      "First Name": "firstName",
      "Last Name": "lastName",
      Email: "email",
      "Program Name": "programId",
      "Faculty Name": "facultyId",
      "Year Level": "yearLevel", // Optional field
    };

    headers.forEach((header, index) => {
      const internalFieldName = headerMapping[header] || header; // Fallback to original header if not mapped
      memberData[internalFieldName] = values[index] || null; // Use null for empty values
    });

    members.push(memberData);
  }

  return members;
};

export const bulkImportUsers = async (
  memberData: RawMemberData[]
): Promise<BulkImportResult> => {
  const result: BulkImportResult = {
    success: false,
    totalProcessed: memberData.length,
    successfulImports: 0,
    errors: [],
    duplicates: [],
  };

  try {
    const referenceData = await loadReferenceData();

    const { duplicates: internalDuplicates, uniqueMembers } = checkInternalDuplicates(memberData);
    
    internalDuplicates.forEach((duplicate) => {
      const [firstRow, ...duplicateRows] = duplicate.rows;
      duplicateRows.forEach((row) => {
        result.errors.push({
          row: row,
          studentId: duplicate.studentId,
          error: `Duplicate Student ID in CSV file. First occurrence at row ${firstRow}`,
        });
      });
    });

    const memberDataToProcess = uniqueMembers;

    const validatedMembers: ValidatedMemberData[] = [];

    for (const data of memberDataToProcess) {
      const validationErrors = await validateMemberData(data);

      if (validationErrors.length > 0) {
        result.errors.push({
          row: data.rowNumber,
          studentId: (data.studentId as string) || "N/A",
          error: validationErrors.join(", "),
        });
        continue; // Skip to next record
      }

      const validatedMember: ValidatedMemberData = {
        createdAt: Timestamp.now(),
        isDeleted: false,
        rowNumber: data.rowNumber,
        studentId: (data.studentId as string).trim(),
        firstName: (data.firstName as string).trim(),
        lastName: (data.lastName as string).trim(),
        email: (data.email as string).trim().toLowerCase(), 
        programId:
          referenceData.programs.get((data.programId as string).trim())?.id ||
          "",
        facultyId:
          referenceData.faculties.get((data.facultyId as string).trim())?.id ||
          "",
        role: "user", 
        yearLevel: (data.yearLevel !== undefined && 
                   data.yearLevel !== null && 
                   data.yearLevel !== "" && 
                   (typeof data.yearLevel === "string" ? data.yearLevel.trim() !== "" : true))
          ? typeof data.yearLevel === "string"
            ? parseInt(data.yearLevel.trim())
            : Number(data.yearLevel)
          : 0, 
        status: "approved",
        registrationAt: Timestamp.now()
      };

      validatedMembers.push(validatedMember);
    }

    if (validatedMembers.length === 0) {
      result.success = false;
      clearReferenceCache();
      return result;
    }

    const studentIds = validatedMembers.map((member) => member.studentId);
    const existingStudentIds = await checkExistingStudentIds(studentIds);

    const membersToImport = validatedMembers.filter((member) => {
      if (existingStudentIds.includes(member.studentId)) {
        result.duplicates.push(member.studentId);
        return false; 
      }
      return true; 
    });

    if (membersToImport.length === 0) {
      result.success = true;
      clearReferenceCache();
      return result;
    }

    const batch = writeBatch(db);
    const timestamp = Timestamp.now();

    membersToImport.forEach((member) => {
      const docRef = doc(collection(db, "users"));

      const memberDataForSave = {
        ...member,
        createdAt: timestamp,
        isDeleted: false,
      };

      const { rowNumber, ...memberDataWithoutRow } = memberDataForSave;

      batch.set(docRef, memberDataWithoutRow);
      
    });

    await batch.commit();
    const user = await getCurrentUserData() as unknown as Member;
    for (const member of membersToImport) {
      try {
        const docRef = query(collection(db, "users"), where("studentId", "==", member.studentId));
        const snapshot = await getDocs(docRef);
        await addStudentWithClearance(snapshot.docs[0].id, member, user?.orgId || "");
      }
      catch (error) {
        result.errors.push({
          row: member.rowNumber,
          studentId: member.studentId,
          error: "Failed to add student with clearance",
        });
      }
    }

    result.successfulImports = membersToImport.length;
    result.success = true;

    clearReferenceCache();

    return result;
  } catch (error) {
    clearReferenceCache();
    handleFirestoreError(error, "bulk import users");
    result.success = false;
    return result;
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const processFileForBulkImport = async (
  file: File,
  onProgress?: (progress: {
    processedCount: number;
    totalCount: number;
    currentBatch: number;
    totalBatches: number;
  }) => void
): Promise<BulkImportResult> => {
  try {
    const validTypes = ["text/csv"];
    const validExtensions = [".csv"];

    const hasValidType =
      validTypes.includes(file.type) ||
      validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidType) {
      throw new Error("Invalid file type. Please upload a CSV file.");
    }

    const fileContent = await file.text();

    const memberData = parseCSVContent(fileContent);

    const BATCH_SIZE = memberData.length < 200 ? Math.ceil(memberData.length / 3) : 200; 
    
    const aggregatedResult: BulkImportResult = {
      success: true,
      totalProcessed: 0,
      successfulImports: 0,
      errors: [],
      duplicates: [],
    };

    for (let i = 0; i < memberData.length; i += BATCH_SIZE) {
      const chunk = memberData.slice(i, i + BATCH_SIZE);
      
      const chunkResult = await bulkImportUsers(chunk);

      aggregatedResult.totalProcessed += chunkResult.totalProcessed;
      aggregatedResult.successfulImports += chunkResult.successfulImports;
      
      if (chunkResult.errors) {
        aggregatedResult.errors.push(...chunkResult.errors);
      }
      if (chunkResult.duplicates) {
        aggregatedResult.duplicates.push(...chunkResult.duplicates);
      }

      if (onProgress) {
        onProgress({
          processedCount: aggregatedResult.totalProcessed,
          totalCount: memberData.length,
          currentBatch: Math.floor(i / BATCH_SIZE) + 1,
          totalBatches: Math.ceil(memberData.length / BATCH_SIZE),
        });
      }

      if (i + BATCH_SIZE < memberData.length) {
        await sleep(1000);
      }
    }

    aggregatedResult.success = aggregatedResult.errors.length === 0;

    return aggregatedResult;

  } catch (error) {
    return {
      success: false,
      totalProcessed: 0,
      successfulImports: 0,
      errors: [
        {
          row: 0,
          studentId: "N/A",
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      ],
      duplicates: [],
    };
  }
};