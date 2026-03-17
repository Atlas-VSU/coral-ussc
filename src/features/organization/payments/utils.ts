
import { customAlphabet } from 'nanoid';
const cleanAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateCleanId = customAlphabet(cleanAlphabet, 5);


export const generateReceiptId = () => {
  const timestamp = Date.now().toString();
  const receiptId = `RCP-${generateCleanId()}-${timestamp.slice(-4)}`;
  return receiptId;
}
