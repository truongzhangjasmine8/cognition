export const ROLES = [
  "agent",
  "kyc_analyst",
  "compliance",
  "finance_manager",
  "engineer",
  "admin",
] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "kyc:view",
  "kyc:view_pii",
  "kyc:assign",
  "kyc:decide",
  "refunds:view",
  "refunds:request",
  "refunds:approve",
  "flags:view",
  "flags:edit_nonprod",
  "flags:request_prod",
  "flags:approve_prod",
  "disputes:view",
  "disputes:work",
  "disputes:write_off",
  "approvals:view",
  "approvals:decide",
  "audit:view",
  "audit:export",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  agent: ["kyc:view", "refunds:view", "refunds:request", "flags:view", "disputes:view", "disputes:work"],
  kyc_analyst: ["kyc:view", "kyc:view_pii", "kyc:assign", "kyc:decide", "approvals:view"],
  compliance: [
    "kyc:view",
    "kyc:view_pii",
    "kyc:decide",
    "refunds:view",
    "disputes:view",
    "approvals:view",
    "approvals:decide",
    "audit:view",
    "audit:export",
  ],
  finance_manager: ["refunds:view", "refunds:request", "refunds:approve", "disputes:view", "disputes:work", "disputes:write_off", "approvals:view", "approvals:decide", "audit:view"],
  engineer: ["flags:view", "flags:edit_nonprod", "flags:request_prod", "approvals:view", "audit:view"],
  admin: ALL,
};

export const ROLE_LABELS: Record<Role, string> = {
  agent: "Support agent",
  kyc_analyst: "KYC analyst",
  compliance: "Compliance officer",
  finance_manager: "Finance manager",
  engineer: "Engineer",
  admin: "Admin",
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function can(role: string, permission: Permission): boolean {
  if (!isRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export class ForbiddenError extends Error {
  constructor(permission: Permission, role: string) {
    super(`Role "${role}" lacks permission "${permission}"`);
    this.name = "ForbiddenError";
  }
}

export function authorize(user: { role: string }, permission: Permission): void {
  if (!can(user.role, permission)) throw new ForbiddenError(permission, user.role);
}
