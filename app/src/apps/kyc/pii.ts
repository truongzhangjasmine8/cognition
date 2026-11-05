import { can } from "@/platform/rbac";

export type ApplicantPII = { fullName: string; email: string; dateOfBirth: string; nationalId: string };

// Masking happens on the server before data reaches the browser. In Power Apps
// the equivalent is column-level security, which hides the column entirely.
export function maskPII<T extends ApplicantPII>(applicant: T, role: string): T & { piiMasked: boolean } {
  if (can(role, "kyc:view_pii")) return { ...applicant, piiMasked: false };
  const [local, domain] = applicant.email.split("@");
  const [first, ...rest] = applicant.fullName.split(" ");
  return {
    ...applicant,
    fullName: `${first} ${rest.map((n) => `${n.slice(0, 1)}.`).join(" ")}`.trim(),
    email: `${local.slice(0, 1)}•••@${domain}`,
    dateOfBirth: `${applicant.dateOfBirth.slice(0, 4)}-••-••`,
    nationalId: `•••-••-${applicant.nationalId.slice(-4)}`,
    piiMasked: true,
  };
}

export function riskTone(score: number) {
  return score >= 70 ? "red" : score >= 40 ? "amber" : "green";
}
