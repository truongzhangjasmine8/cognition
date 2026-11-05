import { cookies } from "next/headers";
import { db } from "@/lib/db";

export type CurrentUser = { id: string; name: string; email: string; role: string };

const COOKIE = "demo_user";

// Dev-mode identity: a cookie selects one of the seeded users. In production this
// module is the only place that changes: swap for an OIDC session (Okta / Entra ID)
// and map IdP groups to roles.
export const DEMO_AUTH_ENABLED = process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_AUTH === "1";

export async function getCurrentUser(): Promise<CurrentUser> {
  if (!DEMO_AUTH_ENABLED) {
    throw new Error("Demo cookie identity is disabled in production. Wire an OIDC session here (see README) or set ALLOW_DEMO_AUTH=1 for a demo deployment.");
  }
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  const user =
    (id ? await db.user.findUnique({ where: { id } }) : null) ??
    (await db.user.findFirstOrThrow({ orderBy: { id: "asc" } }));
  return user;
}

export async function setCurrentUser(id: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
}
