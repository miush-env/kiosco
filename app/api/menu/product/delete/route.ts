import { NextResponse } from "next/server";
import { deleteProductAsync } from "@/lib/db";
import { isAdminOrOwner } from "@/lib/roles";

export async function POST(req: Request) {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: "Acceso exclusivo para Dueño / Administrador." },
      { status: 403 }
    );
  }

  try {
    const { id } = await req.json();
    const deleteId = Number(id);
    if (!deleteId) {
      return NextResponse.json({ success: false, message: "ID inválido." }, { status: 400 });
    }

    await deleteProductAsync(deleteId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[POST /api/menu/product/delete Error]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
