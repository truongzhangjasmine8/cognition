import type { Permission } from "./rbac";

export type AppDefinition = {
  slug: string;
  name: string;
  description: string;
  href: string;
  permission: Permission;
  kind: "app" | "platform";
};

// Adding a tool = one entry here + a folder under src/app/<slug>. The shell,
// navigation and home page pick it up automatically.
export const APPS: AppDefinition[] = [
  { slug: "kyc", name: "KYC Review Queue", description: "Review onboarding applicants, assign work, approve or escalate.", href: "/kyc", permission: "kyc:view", kind: "app" },
  { slug: "refunds", name: "Refunds", description: "Request refunds; large ones need a second approver.", href: "/refunds", permission: "refunds:view", kind: "app" },
  { slug: "flags", name: "Feature Flags", description: "Per-environment flags with rollouts; prod changes need approval.", href: "/flags", permission: "flags:view", kind: "app" },
  { slug: "disputes", name: "Chargeback Disputes", description: "Track card disputes against deadlines; accepting large ones needs Finance sign-off.", href: "/disputes", permission: "disputes:view", kind: "app" },
  { slug: "approvals", name: "Approvals", description: "Everything waiting for a second pair of eyes.", href: "/approvals", permission: "approvals:view", kind: "platform" },
  { slug: "audit", name: "Audit Log", description: "Tamper-evident record of every action, exportable for auditors.", href: "/audit", permission: "audit:view", kind: "platform" },
];
