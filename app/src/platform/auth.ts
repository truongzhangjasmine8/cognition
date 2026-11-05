import { cookies } from "next/headers";
import { db } from "@/lib/db";

export type CurrentUser = { id: string; name: string; email: string; role: string };

const COOKIE = "demo_user";

// Dev-mode identity: a cookie selects one of the seeded users. In production this
// module is the only place that changes: swap for an OIDC session (Okta / Entra ID)
// and map IdP groups to roles.
export async function getCurrentUser(): Promise<CurrentUser> {
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
