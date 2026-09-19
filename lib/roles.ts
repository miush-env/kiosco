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

  // Verificación por correo electrónico, username y nombre completo
  const userEmails = user?.emailAddresses?.map((e) => e.emailAddress.toLowerCase()) || [];
  const username = (user?.username || "").toLowerCase();
  const firstName = (user?.firstName || "").toLowerCase();
  const lastName = (user?.lastName || "").toLowerCase();
  const fullName = `${firstName} ${lastName}`.trim().toLowerCase();

  const isOwnerMatch =
    userEmails.some(
      (email) =>
        email.includes("basac") ||
        email.includes("basach") ||
        email.includes("bautista") ||
        email.includes("alakary") ||
        email.includes("owner")
    ) ||
    username.includes("basac") ||
    username.includes("basach") ||
    username.includes("bautista") ||
    fullName.includes("basac") ||
    fullName.includes("basach") ||
    fullName.includes("bautista") ||
    firstName.includes("basac") ||
    firstName.includes("basach");

  if (isOwnerMatch) {
    return "owner";
  }

  const isAdminMatch =
    userEmails.some(
      (email) =>
        email.includes("leira") ||
        email.includes("dundo") ||
        email.includes("admin")
    ) ||
    username.includes("leira") ||
    username.includes("dundo") ||
    fullName.includes("leira") ||
    fullName.includes("dundo");

  if (isAdminMatch) {
    return "admin";
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
