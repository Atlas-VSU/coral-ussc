import { useEffect, useState } from "react";
import { Member, Program } from "../../members/types";
import {
  addUser,
  checkEmailExist,
  getCurrentUserData,
  getProgramByFacultyId,
  getPrograms,
} from "@/firebase";
import { resolveStudentIdentity } from "@/firebase/users";
import { useStudentRestore } from "@/hooks/useStudentRestore";
import { isValidStudentId } from "../utils";
import { getAllOrgs } from "@/firebase/organization";
import { onboardNewStudent } from "@/firebase/onboarding";

interface useAddStudentFormProps {
  suggestedId: string;
  /** `restored` distinguishes bringing a retired record back from creating a
   *  new student — the two produce very different follow-up messaging. */
  onStudentAdded: (student: Member, meta?: { restored: boolean }) => void;
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
  // Shared with the Members page: when the Student ID belongs to a retired
  // record, this owns the prompt, the restore and its reporting, so both
  // surfaces behave identically.
  const {
    pending,
    isRestoring,
    error: restoreError,
    promptRestore,
    dismissRestore,
    confirmRestore,
  } = useStudentRestore({
    onRestored: (student) => {
      onStudentAdded(student, { restored: true });
      onOpenChange(false);
    },
  });

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
      dismissRestore();
    }
  }, [open, suggestedId, dismissRestore]);

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
   *
   * The work itself, the reporting and the refusal messages all live in
   * `useStudentRestore`, shared with the Members page.
   */
  const handleRestore = () => confirmRestore();

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
        promptRestore(identity, { ...formData, role: "user" as const });
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
    isSubmitting: isSubmitting || isRestoring,
    formErrors,
    handleChange,
    handleSubmit,
    programData,
    handleSelectChange,
    archivedMatch: pending?.resolution ?? null,
    restoreError,
    handleRestore,
    dismissArchivedMatch: dismissRestore,
  };
}
