import { auth, currentUser } from "@clerk/nextjs/server";

export type Role = "owner" | "admin" | null;

export async function getRole(): Promise<Role> {
  const { sessionClaims } = await auth();
  const sessionRole = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
  if (sessionRole === "owner" || sessionRole === "admin") {
    return sessionRole;
  }

  // Fallback directo a currentUser() por si el token de sesión aún no incluye publicMetadata en JWT
  const user = await currentUser();
  const metaRole = (user?.publicMetadata as { role?: string } | undefined)?.role;
  if (metaRole === "owner" || metaRole === "admin") {
    return metaRole;
  }

  return null;
}

export async function isAdminOrOwner(): Promise<boolean> {
  const role = await getRole();
  return role === "admin" || role === "owner";
}

export async function isOwner(): Promise<boolean> {
  return (await getRole()) === "owner";
}
