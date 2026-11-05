import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const users = [
  { id: "u_ana", name: "Ana Torres", email: "ana@acme-fin.example", role: "agent" },
  { id: "u_kai", name: "Kai Nakamura", email: "kai@acme-fin.example", role: "kyc_analyst" },
  { id: "u_priya", name: "Priya Shah", email: "priya@acme-fin.example", role: "compliance" },
  { id: "u_marco", name: "Marco Rossi", email: "marco@acme-fin.example", role: "finance_manager" },
  { id: "u_dev", name: "Devon Lee", email: "devon@acme-fin.example", role: "engineer" },
  { id: "u_sam", name: "Sam Okafor", email: "sam@acme-fin.example", role: "admin" },
];

const firstNames = ["Olivia", "Liam", "Emma", "Noah", "Ava", "Elijah", "Sophia", "Lucas", "Mia", "Mateo", "Zoe", "Ethan", "Chloe", "Aarav", "Fatima", "Yuki"];
const lastNames = ["Martin", "Garcia", "Kowalski", "Nguyen", "Okoro", "Silva", "Müller", "Haddad", "Petrov", "Osei", "Brennan", "Ivanova"];
const countries = ["US", "GB", "DE", "BR", "NG", "IN", "CA", "FR"];
const kycStatuses = ["pending", "pending", "pending", "in_review", "approved", "rejected", "escalated"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function main() {
  await db.auditEvent.deleteMany();
  await db.approvalRequest.deleteMany();
  await db.refund.deleteMany();
  await db.kycApplicant.deleteMany();
  await db.flagEnvironment.deleteMany();
  await db.featureFlag.deleteMany();
  await db.user.deleteMany();

  await db.user.createMany({ data: users });

  const applicants = Array.from({ length: 24 }, (_, i) => {
    const first = pick(firstNames, i * 7 + 3);
    const last = pick(lastNames, i * 5 + 1);
    const risk = (i * 37) % 100;
    const status = pick(kycStatuses, i);
    return {
      id: `KYC-${1041 + i}`,
      fullName: `${first} ${last}`,
      email: `${first}.${last}@mail.example`.toLowerCase(),
      dateOfBirth: `${1965 + ((i * 3) % 35)}-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + ((i * 7) % 28)).padStart(2, "0")}`,
      nationalId: `${String(100 + i).padStart(3, "0")}-${String(40 + i).padStart(2, "0")}-${String(1000 + i * 131).slice(-4)}`,
      country: pick(countries, i),
      riskScore: risk,
      status,
      assigneeId: status === "in_review" ? "u_kai" : null,
      assigneeName: status === "in_review" ? "Kai Nakamura" : null,
      decisionNote: status === "rejected" ? "Document mismatch" : status === "approved" ? "Verified" : null,
      createdAt: new Date(Date.now() - i * 3600_000 * 5),
    };
  });
  await db.kycApplicant.createMany({ data: applicants });

  const refunds = Array.from({ length: 18 }, (_, i) => {
    const amount = [1999, 4500, 12000, 68000, 250000, 8900, 52000, 3100][i % 8];
    const status = ["pending_approval", "approved", "processed", "rejected", "pending_approval", "processed"][i % 6];
    return {
      id: `RF-${7001 + i}`,
      orderId: `ORD-${55000 + i * 13}`,
      customerName: `${pick(firstNames, i + 5)} ${pick(lastNames, i + 2)}`,
      customerEmail: `${pick(firstNames, i + 5)}.${pick(lastNames, i + 2)}@mail.example`.toLowerCase(),
      amountCents: amount,
      reason: ["Duplicate charge", "Service not delivered", "Customer dispute", "Pricing error"][i % 4],
      status: amount < 50000 && status === "pending_approval" ? "approved" : status,
      requestedById: i % 2 ? "u_ana" : "u_marco",
      requestedByName: i % 2 ? "Ana Torres" : "Marco Rossi",
      createdAt: new Date(Date.now() - i * 3600_000 * 9),
    };
  });
  await db.refund.createMany({ data: refunds });

  const flags = [
    { key: "instant_payouts", description: "Enable instant payouts for verified merchants" },
    { key: "new_kyc_flow", description: "Redesigned onboarding KYC flow" },
    { key: "refund_auto_approve", description: "Auto-approve refunds under $20" },
    { key: "dark_mode", description: "Dark mode in the customer dashboard" },
  ];
  for (const [i, f] of flags.entries()) {
    await db.featureFlag.create({
      data: {
        ...f,
        environments: {
          create: [
            { env: "dev", enabled: true, rolloutPct: 100 },
            { env: "staging", enabled: i !== 3, rolloutPct: 100 },
            { env: "prod", enabled: i === 0, rolloutPct: i === 0 ? 25 : 0 },
          ],
        },
      },
    });
  }
  console.log(`Seeded ${users.length} users, ${applicants.length} applicants, ${refunds.length} refunds, ${flags.length} flags`);
}

main().finally(() => db.$disconnect());
