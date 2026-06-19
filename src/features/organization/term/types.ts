import { Timestamp } from "firebase/firestore";

export type Term = {
  id?: string;
  AY: string;
  isActive: boolean;
  metadata: {
    createdAt: Timestamp | null;
    updatedAt: Timestamp | null;
  };
  semester: string;
  isDeleted: false;
}