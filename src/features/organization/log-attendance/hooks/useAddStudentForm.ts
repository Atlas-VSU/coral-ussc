import { useEffect, useState } from "react";
import { Member, Program } from "../../members/types";
import {
  addUser,
  checkEmailExist,
  getCurrentUserData,
  getProgramByFacultyId,
  getPrograms,
} from "@/firebase";
import { resolveStudentIdentity, type StudentIdentityResolution } from "@/firebase/users";
import { restoreStudentRecord } from "@/firebase/restore";
import { isValidStudentId } from "../utils";
import { getAllOrgs } from "@/firebase/organization";
import { onboardNewStudent } from "@/firebase/onboarding";

/** The archived record a submitted Student ID already belongs to. */
type ArchivedMatch = Extract<StudentIdentityResolution, { status: "archived" }>;

interface useAddStudentFormProps {
  suggestedId: string;
  onStudentAdded: (student: Member) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialFormData: Member = {
  studentId: "",
  firstName: "",
  lastName: "",
  email: "",
  programId: "",
  facultyId: "",
  role: "user",
};

type FormErrors = {
  studentId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  programId?: string;
};

export function useAddStudentForm({
  suggestedId,
  onStudentAdded,
  open,
  onOpenChange,
}: useAddStudentFormProps) {
  const [formData, setFormData] = useState<Member>({
    ...initialFormData,
    studentId: suggestedId,
  });
  const [consentChecked, setConsentChecked] = useState(false);
  const [showConsentError, setShowConsentError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [programData, setProgramData] = useState<Program[]>([]);
  // Set when the Student ID belongs to a retired record — the dialog then
  // offers a restore instead of reporting a duplicate.
  const [archivedMatch, setArchivedMatch] = useState<ArchivedMatch | null>(null);

  useEffect(() => {
    const fetchProgramData = async () => {
      try {
        const data = (await getProgramByFacultyId()) as Program[];
        setProgramData(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Failed to fetch program data:", error);
      }
    };
    if (open) {
      fetchProgramData();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setFormData({ ...initialFormData, studentId: suggestedId });
      setConsentChecked(false);
      setShowConsentError(false);
      setFormErrors({});
      setArchivedMatch(null);
    }
  }, [open, suggestedId]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.studentId) {
      errors.studentId = "Student ID is required";
    } else if (!isValidStudentId(formData.studentId)) {
      errors.studentId = "Invalid format. Use XX-X-XXXXX (e.g., 20-1-01709)";
    }
    if (!formData.firstName) errors.firstName = "First name is required";
    if (!formData.lastName) errors.lastName = "Last name is required";
    if (!formData.programId) errors.programId = "Program is required";
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, programId: value }));
    if (formErrors.programId) {
      setFormErrors((prev) => ({ ...prev, programId: undefined }));
    }
  };

  /**
   * Restores the retired record this Student ID already belongs to, instead of
   * creating a duplicate. Deliberately does NOT call `onboardNewStudent` —
   * onboarding backfills a fresh set of fees and fines, which would stack on
   * top of the ones being reinstated and double-charge the student.
   */
  const handleRestore = async () => {
    if (!archivedMatch) return;
    setIsSubmitting(true);
    try {
      const currentUser = (await getCurrentUserData()) as unknown as Member;
      await restoreStudentRecord(archivedMatch.docId, formData.studentId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        programId: formData.programId,
        facultyId: currentUser.facultyId || "",
      });
      onStudentAdded({ ...formData, role: "user" as const });
      setArchivedMatch(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to restore student:", error);
      setFormErrors({ studentId: "Failed to restore this record. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConsentError(!consentChecked);
    const isFormValid = validateForm();
    if (!isFormValid || !consentChecked) {
      return;
    }
    setIsSubmitting(true);
    try {
      const identity = await resolveStudentIdentity(formData.studentId);

      if (identity.status === "active") {
        setFormErrors({ studentId: "Student ID already exists" });
        return;
      }

      // A retired record still holds this Student ID. Creating a second one
      // would strand the student's fees, fines and clearance on the dead
      // document and charge them twice — offer to bring the original back.
      if (identity.status === "archived") {
        setArchivedMatch(identity);
        return;
      }

      if (await checkEmailExist(formData.email)) {
        setFormErrors({ email: "Email already exists" });
        return;
      }
      const currentUser = await getCurrentUserData() as unknown as Member;
      const facultyId = currentUser.facultyId;

      const newStudentData = {
        ...formData,
        facultyId: facultyId || "",
        role: "user" as const,
      };

      const userId = await addUser(newStudentData);
      const allOrgs = await getAllOrgs();
      await onboardNewStudent(userId!, newStudentData as Member, allOrgs, currentUser);
      onStudentAdded(newStudentData);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add student:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    consentChecked,
    setConsentChecked,
    showConsentError,
    setShowConsentError,
    isSubmitting,
    formErrors,
    handleChange,
    handleSubmit,
    programData,
    handleSelectChange,
    archivedMatch,
    handleRestore,
    dismissArchivedMatch: () => setArchivedMatch(null),
  };
}
