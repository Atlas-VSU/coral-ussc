import { FineItem, FinesPaymentLog, StudentFines } from "../types";


export function computeTotalPaid(record: FinesPaymentLog[]) {
  let paidAmount = 0;
    record.forEach(r => {
      if (r.status === "verified") {
          paidAmount += r.amount;
      }
    })
  return paidAmount;
}
