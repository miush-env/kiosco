import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "No autenticado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requestedRole = body.role === "admin" ? "admin" : "owner";

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: requestedRole,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Rol asignado con éxito: ${requestedRole}`,
      role: requestedRole,
    });
  } catch (error: any) {
    console.error("Error setting user role:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
