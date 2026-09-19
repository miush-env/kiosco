export type UserRole = "owner" | "admin" | "customer";

/**
 * Returns the effective user role on client or server.
 * Recognizes 'basach' as Owner and 'leira dundo' as Admin automatically.
 */
export function getUserRole(user: any): UserRole {
  if (!user) return "customer";

  const metaRole = (user.publicMetadata as { role?: string } | undefined)?.role;
  if (metaRole === "owner" || metaRole === "admin") {
    return metaRole;
  }

  const emails: string[] = [];
  if (user.emailAddresses && Array.isArray(user.emailAddresses)) {
    user.emailAddresses.forEach((e: any) => {
      if (e?.emailAddress) emails.push(e.emailAddress.toLowerCase());
    });
  }
  if (user.primaryEmailAddress?.emailAddress) {
    emails.push(user.primaryEmailAddress.emailAddress.toLowerCase());
  }

  const username = (user.username || "").toLowerCase();
  const firstName = (user.firstName || "").toLowerCase();
  const lastName = (user.lastName || "").toLowerCase();
  const fullName = (user.fullName || (firstName + " " + lastName)).toLowerCase();

  const isOwner =
    emails.some((em) =>
      em.includes("basac") ||
      em.includes("basach") ||
      em.includes("bautista") ||
      em.includes("alakary") ||
      em.includes("owner")
    ) ||
    username.includes("basac") ||
    username.includes("basach") ||
    username.includes("bautista") ||
    fullName.includes("basac") ||
    fullName.includes("basach") ||
    fullName.includes("bautista") ||
    firstName.includes("basac") ||
    firstName.includes("basach");

  if (isOwner) return "owner";

  const isAdmin =
    emails.some((em) => em.includes("leira") || em.includes("dundo") || em.includes("admin")) ||
    username.includes("leira") ||
    username.includes("dundo") ||
    fullName.includes("leira") ||
    fullName.includes("dundo");

  if (isAdmin) return "admin";

  return "customer";
}

export function isUserAdminOrOwner(user: any): boolean {
  const role = getUserRole(user);
  return role === "owner" || role === "admin";
}
