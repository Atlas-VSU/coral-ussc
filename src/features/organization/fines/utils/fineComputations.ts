import { FineItem, PaymentLog, StudentFines } from "../types";


export function computeTotalPaid(record: PaymentLog[]) {
  let paidAmount = 0;
    record.forEach(r => {
      if (r.status === "verified") {
          paidAmount += r.amount;
      }
    })
  return paidAmount;
}
