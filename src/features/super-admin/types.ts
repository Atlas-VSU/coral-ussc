// Super Admin Types 
// All data shapes are read-only mirrors of Firestore documents.

export type OrgLevel = "department" | "faculty" | "council";
export type SubscriptionTier = "basic" | "plus" | "premium";

export interface SuperAdminOrg {
  id: string;
  name: string;
  short_name: string;
  level: OrgLevel;
  faculty_id: string | null;
  faculty_name: string | null;
  faculty_acronym: string | null;
  program_id: string | null;
  program_name: string | null;
  program_acronym: string | null;
  is_archived: boolean;
  subscribed: boolean;
  subscription_tier: SubscriptionTier | null;
}

export interface SuperAdminOrgAccount {
  id: string;
  org_id: string;
  org_name: string | null;
  full_name: string;
  email: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string | null;
}

export interface SuperAdminFaculty {
  id: string;
  name: string;
  acronym: string;
}

export interface SuperAdminProgram {
  id: string;
  name: string;
  acronym: string;
  faculty_id: string;
}

// Dashboard aggregate stats 
export interface DashboardStats {
  total_subscribed: number;
  tier_counts: {
    basic: number;
    plus: number;
    premium: number;
  };
  total_active_accounts: number;
  total_archived: number;
  total_orgs: number;
}

//  Full data payload returned by the server data layer 
export interface SuperAdminPageData {
  orgs: SuperAdminOrg[];
  accounts: SuperAdminOrgAccount[];
  stats: DashboardStats;
}
