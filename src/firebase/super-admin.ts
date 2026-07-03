/**
 * Server-side data fetching for the Super Admin dashboard.
 * Uses Firebase Admin SDK (adminDb) — runs ONLY on the server.
 * All Timestamps are converted to ISO strings before returning.
 * No write operations are performed.
 */

import { adminDb } from "@/firebase/firebase-admin.config";
import type {
  SuperAdminOrg,
  SuperAdminOrgAccount,
  SuperAdminFaculty,
  SuperAdminProgram,
  DashboardStats,
  SuperAdminPageData,
  SubscriptionTier,
  OrgLevel,
} from "@/features/super-admin/types";
import type { Timestamp } from "firebase-admin/firestore";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toISOString(value: unknown): string | null {
  if (!value) return null;
  // Firebase Admin Timestamp has a toDate() method
  if (typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

// ─── Faculties ────────────────────────────────────────────────────────────────

export async function fetchFaculties(): Promise<SuperAdminFaculty[]> {
  const snap = await adminDb.collection("faculties").get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name ?? "",
      acronym: d.acronym ?? "",
    };
  });
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export async function fetchPrograms(): Promise<SuperAdminProgram[]> {
  const snap = await adminDb.collection("programs").get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name ?? "",
      acronym: d.acronym ?? "",
      faculty_id: d.faculty_id ?? d.facultyId ?? "",
    };
  });
}

// ─── Organizations ────────────────────────────────────────────────────────────

export async function fetchOrganizations(
  facultyMap: Map<string, SuperAdminFaculty>,
  programMap: Map<string, SuperAdminProgram>
): Promise<SuperAdminOrg[]> {
  const snap = await adminDb.collection("organizations").get();
  return snap.docs.map((doc) => {
    const d = doc.data();

    const facultyId: string | null = d.faculty_id ?? d.facultyId ?? null;
    const programId: string | null = d.program_id ?? d.programId ?? null;

    const faculty = facultyId ? facultyMap.get(facultyId) ?? null : null;
    const program = programId ? programMap.get(programId) ?? null : null;

    const accessLevelValue = d.accessLevel ?? d.access_level ?? d.level;
    let computedLevel: OrgLevel = "department";
    if (accessLevelValue === 2 || accessLevelValue === "2" || accessLevelValue === "faculty") {
      computedLevel = "faculty";
    } else if (accessLevelValue === 3 || accessLevelValue === "3" || accessLevelValue === "council") {
      computedLevel = "council";
    }

    return {
      id: doc.id,
      name: d.name ?? "",
      short_name: d.short_name ?? d.shortName ?? "",
      level: computedLevel,
      faculty_id: facultyId,
      faculty_name: faculty?.name ?? null,
      faculty_acronym: faculty?.acronym ?? null,
      program_id: programId,
      program_name: program?.name ?? null,
      program_acronym: program?.acronym ?? null,
      is_archived: d.is_archived ?? d.isArchived ?? false,
      subscribed: d.subscribed ?? false,
      subscription_tier: (d.subscription_tier ?? null) as SubscriptionTier | null,
    };
  });
}

// ─── Org Accounts ─────────────────────────────────────────────────────────────

export async function fetchOrgAccounts(
  orgMap: Map<string, SuperAdminOrg>
): Promise<SuperAdminOrgAccount[]> {
  const snap = await adminDb.collection("users").where("role", "==", "admin").get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    const orgId: string = d.orgId ?? d.org_id ?? "";
    const org = orgId ? orgMap.get(orgId) ?? null : null;

    return {
      id: doc.id,
      org_id: orgId,
      org_name: org?.name ?? null,
      full_name: (d.name ?? d.fullName ?? d.full_name ?? `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim()) || "Admin User",
      email: d.email ?? "",
      is_active: d.is_active ?? d.isActive ?? true,
      is_deleted: d.is_deleted ?? d.isDeleted ?? false,
      created_at: toISOString(d.created_at ?? d.createdAt ?? d.metadata?.createdAt),
    };
  });
}

// ─── Aggregate Stats ──────────────────────────────────────────────────────────

export function computeStats(
  orgs: SuperAdminOrg[],
  accounts: SuperAdminOrgAccount[]
): DashboardStats {
  const subscribedOrgs = orgs.filter((o) => o.subscribed);
  const tierCounts = { basic: 0, plus: 0, premium: 0 };
  for (const org of subscribedOrgs) {
    if (org.subscription_tier === "basic") tierCounts.basic++;
    else if (org.subscription_tier === "plus") tierCounts.plus++;
    else if (org.subscription_tier === "premium") tierCounts.premium++;
  }

  return {
    total_orgs: orgs.length,
    total_subscribed: subscribedOrgs.length,
    tier_counts: tierCounts,
    total_active_accounts: accounts.filter(
      (a) => a.is_active && !a.is_deleted
    ).length,
    total_archived: orgs.filter((o) => o.is_archived).length,
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Fetches ALL super admin data in parallel and returns fully resolved,
 * serializable objects. Safe to call from Server Components / Server Actions.
 */
export async function fetchSuperAdminData(): Promise<SuperAdminPageData> {
  // Fetch faculties and programs first (needed to resolve org references)
  const [faculties, programs] = await Promise.all([
    fetchFaculties(),
    fetchPrograms(),
  ]);

  const facultyMap = new Map(faculties.map((f) => [f.id, f]));
  const programMap = new Map(programs.map((p) => [p.id, p]));

  // Fetch orgs (needs faculty/program maps for resolution)
  const orgs = await fetchOrganizations(facultyMap, programMap);
  const orgMap = new Map(orgs.map((o) => [o.id, o]));

  // Fetch accounts (needs org map for resolution)
  const accounts = await fetchOrgAccounts(orgMap);

  const stats = computeStats(orgs, accounts);

  return { orgs, accounts, stats };
}
