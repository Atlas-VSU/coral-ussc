import { Timestamp } from "firebase/firestore";
import { Fee } from "../fees/types";
import { ProofOfPayment, StudentFines } from "../fines/types";
import { Member } from "../members/types";

export type ImageData = {
    file: File;
    preview: string; // base64 or object URL for previewing the image
};
    

export type OnlinePaymentMethod = "gcash";

export type StudentFineItem = {
  refId: string;
  userId: string;
  fine: StudentFines;
  parentFineId: string;
  title: string;
  amount: number;
}

export type UnpaidDue = {
  id: string
  type: string
  name: string
  item: Fee | StudentFineItem 
  balance: number
  parentId?: string
}

export interface StudentUnpaidRecord {
  student: Member
  dues: UnpaidDue[]
}

export type PaidObject = {
  object: Fee & StudentFines;
  payment: ProofOfPayment;
}

export type Payment = {
  code: string;
  payer: string;
  type: string;
  status: string;
  items: PaidObject[];
  amount: number;
}
