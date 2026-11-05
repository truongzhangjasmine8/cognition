import { describe, expect, it } from "vitest";
import { assertNotSelfApproval, SelfApprovalError } from "../approvals";
import { needsSecondApprover, REFUND_APPROVAL_THRESHOLD_CENTS } from "@/apps/refunds/rules";

describe("maker-checker", () => {
  it("rejects self-approval", () => {
    expect(() => assertNotSelfApproval("u_marco", "u_marco")).toThrow(SelfApprovalError);
    expect(() => assertNotSelfApproval("u_ana", "u_marco")).not.toThrow();
  });
  it("routes refunds at or above the threshold to a second approver", () => {
    expect(needsSecondApprover(REFUND_APPROVAL_THRESHOLD_CENTS - 1)).toBe(false);
    expect(needsSecondApprover(REFUND_APPROVAL_THRESHOLD_CENTS)).toBe(true);
  });
});
