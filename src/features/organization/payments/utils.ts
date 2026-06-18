import { getOrgById } from '@/firebase/organization';
import { useAuth } from '@/hooks/useAuth';
import { customAlphabet } from 'nanoid';

const cleanAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateCleanId = customAlphabet(cleanAlphabet, 4);


export const generateReceiptId = (shortName: string) => {
  const timeComponent = Math.floor(Date.now() / 1000).toString(36).toUpperCase();

  const randomComponent = generateCleanId();
  
  return `${shortName.toUpperCase()}-${timeComponent}-${randomComponent}`;
}