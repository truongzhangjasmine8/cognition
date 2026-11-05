import { can } from "@/platform/rbac";

export type ApplicantPII = { email: string; dateOfBirth: string; nationalId: string };

// Masking happens on the server before data reaches the browser. In Power Apps
// the equivalent is column-level security, which hides the column entirely.
export function maskPII<T extends ApplicantPII>(applicant: T, role: string): T & { piiMasked: boolean } {
  if (can(role, "kyc:view_pii")) return { ...applicant, piiMasked: false };
  const [local, domain] = applicant.email.split("@");
  return {
    ...applicant,
    email: `${local.slice(0, 1)}•••@${domain}`,
    dateOfBirth: `${applicant.dateOfBirth.slice(0, 4)}-••-••`,
    nationalId: `•••-••-${applicant.nationalId.slice(-4)}`,
    piiMasked: true,
  };
}

export function riskTone(score: number) {
  return score >= 70 ? "red" : score >= 40 ? "amber" : "green";
}
