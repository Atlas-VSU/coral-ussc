import { useEffect, useState } from "react";
import { Member, Program } from "../../members/types";
import {
  addUser,
  checkStudentIdExist,
  getCurrentUserFacultyId,
  getProgramByFacultyId,
  getPrograms,
} from "@/firebase";
import { isValidStudentId } from "../utils";
import { getAuth } from "firebase/auth";

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

  useEffect(() => {
    const fetchProgramData = async () => {
      try {
        const data = (await getProgramByFacultyId()) as Program[];
        setProgramData(data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConsentError(!consentChecked);
    const isFormValid = validateForm();
    if (!isFormValid || !consentChecked) {
      return;
    }
    setIsSubmitting(true);
    try {
      if (await checkStudentIdExist(formData.studentId)) {
        setFormErrors({ studentId: "Student ID already exists" });
        return;
      }
      const auth = getAuth();
      const facultyId = await getCurrentUserFacultyId(
        auth.currentUser?.uid ?? ""
      );

      const newStudentData = {
        ...formData,
        facultyId: facultyId || "",
        role: "user" as const,
      };

      await addUser(newStudentData);
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
  };
}
