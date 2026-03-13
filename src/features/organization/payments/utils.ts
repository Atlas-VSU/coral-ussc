import { nanoid } from "nanoid"

export const generateReceiptId = () => {
  const receiptId = `RCP-${nanoid(10)}-${Date.now().toLocaleString().replace(/[/,:\s]/g, "")}`;
  return receiptId;
}
