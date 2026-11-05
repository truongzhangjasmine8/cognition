import { createHash } from "node:crypto";

export const ENVIRONMENTS = ["dev", "staging", "prod"] as const;
export type Env = (typeof ENVIRONMENTS)[number];

export function isEnv(v: string): v is Env {
  return (ENVIRONMENTS as readonly string[]).includes(v);
}

// Deterministic bucketing: the same user always lands in the same bucket for a
// given flag, so a 25% rollout is sticky rather than random per request.
export function bucket(flagKey: string, subjectId: string): number {
  const h = createHash("sha256").update(`${flagKey}:${subjectId}`).digest();
  return h.readUInt32BE(0) % 100;
}

export function evaluate(state: { enabled: boolean; rolloutPct: number }, flagKey: string, subjectId?: string): boolean {
  if (!state.enabled) return false;
  if (state.rolloutPct >= 100) return true;
  if (state.rolloutPct <= 0) return false;
  if (!subjectId) return false;
  return bucket(flagKey, subjectId) < state.rolloutPct;
}
