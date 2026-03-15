import { nanoid } from "nanoid"

export const generateReceiptId = () => {
  const timestamp = Date.now().toString();
  const receiptId = `RCP-${nanoid(5)}-${timestamp.slice(-4)}`;
  return receiptId;
}
