import { forbidden } from "next/navigation";
import { getCurrentUser } from "./auth";
import { can, type Permission } from "./rbac";

// Page-level guard: resolves the user and 403s if the role lacks the permission.
export async function requireUser(permission: Permission) {
  const user = await getCurrentUser();
  if (!can(user.role, permission)) forbidden();
  return user;
}
