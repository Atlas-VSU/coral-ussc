export enum PaymentType {
  FEES = "fees",
  FINES = "fines",
  BULK = "bulk"
}

export enum PaymentMethods{
  CASH = "cash",
  GCASH = "gcash",
  BANK_TRANSFER = "bank_transfer",
  WAIVER = "waiver", 
}

export type Term = {
  id?: string,
  AY: string,
  semester: string,
  isActive : boolean,
}

export type Organization = {
  id?: string,
  name: string,
  shortName: string,
  isArchived: boolean,
  subscribed: boolean,
  subscriptionId?: string | null,
  subscriptionTier?: string | null,
  users?: string[],
  facultyId?: string,
  programId?: string,
  accessLevel: number,
  orgLogoUrl?: string
}