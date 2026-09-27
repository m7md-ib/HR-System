import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "./session";
import { can, type Action, type Resource } from "./rbac";

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return getSessionUser();
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(resource: Resource, action: Action): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.role, resource, action)) {
    redirect("/forbidden");
  }
  return user;
}
