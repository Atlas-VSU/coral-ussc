import { FineItem } from "../types";


export function computeTotalPaid(record: FineItem[]) {
  let paidAmount = 0;
    record.forEach(r => {
      if (r.isPaid) {
          paidAmount += r.amount;
      }
    })
  return paidAmount;
}
