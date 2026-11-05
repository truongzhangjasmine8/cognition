import { describe, expect, it } from "vitest";
import { deadlineState, needsWriteOffApproval, WRITE_OFF_APPROVAL_THRESHOLD_CENTS } from "@/apps/disputes/rules";

describe("dispute rules", () => {
  it("large write-offs need approval", () => {
    expect(needsWriteOffApproval(WRITE_OFF_APPROVAL_THRESHOLD_CENTS - 1)).toBe(false);
    expect(needsWriteOffApproval(WRITE_OFF_APPROVAL_THRESHOLD_CENTS)).toBe(true);
  });
  it("classifies deadlines", () => {
    const now = new Date("2026-01-10T00:00:00Z");
    expect(deadlineState(new Date("2026-01-09T00:00:00Z"), now)).toBe("overdue");
    expect(deadlineState(new Date("2026-01-12T00:00:00Z"), now)).toBe("due_soon");
    expect(deadlineState(new Date("2026-01-20T00:00:00Z"), now)).toBe("ok");
  });
});
