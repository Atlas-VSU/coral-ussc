import { Fee } from "../fees/types";
import { StudentFines } from "../fines/types";
import { Member } from "../members/types";

export type ImageData = {
    file: File;
    preview: string; // base64 or object URL for previewing the image
};
    

export type OnlinePaymentMethod = "gcash" | "bank_transfer";

export type UnpaidDue = {
  id: string
  type: string
  name: string
  item: Fee | StudentFines
}

export interface StudentUnpaidRecord {
  student: Member
  dues: UnpaidDue[]
}
