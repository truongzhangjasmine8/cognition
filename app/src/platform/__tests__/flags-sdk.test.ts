import { describe, expect, it } from "vitest";
import { bucket, evaluate } from "@/apps/flags/sdk";

describe("flag evaluation", () => {
  it("is sticky per subject", () => {
    expect(bucket("instant_payouts", "user_42")).toBe(bucket("instant_payouts", "user_42"));
  });
  it("respects enabled and rollout", () => {
    expect(evaluate({ enabled: false, rolloutPct: 100 }, "f", "u")).toBe(false);
    expect(evaluate({ enabled: true, rolloutPct: 100 }, "f")).toBe(true);
    expect(evaluate({ enabled: true, rolloutPct: 0 }, "f", "u")).toBe(false);
  });
  it("rolls out to roughly the configured share of subjects", () => {
    const n = 5000;
    const on = Array.from({ length: n }, (_, i) => evaluate({ enabled: true, rolloutPct: 25 }, "f", `user_${i}`)).filter(Boolean).length;
    expect(on / n).toBeGreaterThan(0.21);
    expect(on / n).toBeLessThan(0.29);
  });
});
