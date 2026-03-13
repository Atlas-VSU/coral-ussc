import { nanoid } from "nanoid"

export const generateReceiptId = () => {
  const receiptId = `RCP-${nanoid(5)}-${Date.now().toLocaleString().slice(0,4).replace(/,/g, "")}`;
  return receiptId;
}
