import { describe, expect, it } from "vitest";
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS, can, authorize, ForbiddenError } from "../rbac";

describe("rbac", () => {
  it("every role maps only to known permissions", () => {
    for (const role of ROLES) for (const p of ROLE_PERMISSIONS[role]) expect(PERMISSIONS).toContain(p);
  });
  it("support agents never see PII or decide KYC", () => {
    expect(can("agent", "kyc:view")).toBe(true);
    expect(can("agent", "kyc:view_pii")).toBe(false);
    expect(can("agent", "kyc:decide")).toBe(false);
  });
  it("only finance managers and admins approve refunds", () => {
    const approvers = ROLES.filter((r) => can(r, "refunds:approve"));
    expect(approvers.sort()).toEqual(["admin", "finance_manager"]);
  });
  it("engineers cannot approve their own prod flag changes", () => {
    expect(can("engineer", "flags:request_prod")).toBe(true);
    expect(can("engineer", "flags:approve_prod")).toBe(false);
  });
  it("unknown roles have no permissions and authorize throws", () => {
    expect(can("ceo", "audit:view")).toBe(false);
    expect(() => authorize({ role: "agent" }, "audit:export")).toThrow(ForbiddenError);
  });
});
