import { describe, expect, it } from "vitest";
import { maskPII } from "@/apps/kyc/pii";
import { csv } from "@/app/audit/export/route";

const applicant = { fullName: "Ethan Silva", email: "ethan.silva@mail.example", dateOfBirth: "1991-04-12", nationalId: "123-45-6789" };

describe("PII masking", () => {
  it("masks every identity field for roles without kyc:view_pii", () => {
    const m = maskPII(applicant, "agent");
    expect(m.piiMasked).toBe(true);
    expect(m.fullName).toBe("Ethan S.");
    expect(m.email).toBe("e•••@mail.example");
    expect(m.dateOfBirth).toBe("1991-••-••");
    expect(m.nationalId).toBe("•••-••-6789");
  });
  it("leaves data intact for kyc_analyst and compliance", () => {
    expect(maskPII(applicant, "kyc_analyst")).toEqual({ ...applicant, piiMasked: false });
    expect(maskPII(applicant, "compliance").piiMasked).toBe(false);
  });
});

describe("csv export", () => {
  it("neutralises spreadsheet formulas and escapes quotes", () => {
    expect(csv("=HYPERLINK(\"http://x\")")).toBe("\"'=HYPERLINK(\"\"http://x\"\")\"");
    expect(csv("+1")).toBe("'+1");
    expect(csv('{"status":"approved"}')).toBe('"{""status"":""approved""}"');
    expect(csv(null)).toBe("");
  });
});
