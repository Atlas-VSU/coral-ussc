
import { customAlphabet } from 'nanoid';
const cleanAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateCleanId = customAlphabet(cleanAlphabet, 4);


export const generateReceiptId = () => {
  const timestamp = Date.now().toString();
  const receiptId = `USSC-${generateCleanId()}-${timestamp.slice(-4)}`;
  return receiptId;
}
