import { NextResponse } from "next/server";
import { sheetsListCategories } from "@/lib/db";
import { isAdminOrOwner } from "@/lib/roles";

export async function GET() {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  try {
    const categories = await sheetsListCategories();
    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Error al obtener categorías" },
      { status: 502 }
    );
  }
}
