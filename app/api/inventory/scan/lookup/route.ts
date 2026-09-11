import { NextResponse } from "next/server";
import { sheetsLookupBarcode } from "@/lib/db";
import { isAdminOrOwner } from "@/lib/roles";

export async function GET(req: Request) {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const barcode = (searchParams.get("barcode") || "").trim();
  if (!barcode) {
    return NextResponse.json({ success: false, message: "Falta el código de barras." }, { status: 400 });
  }

  try {
    const result = await sheetsLookupBarcode(barcode);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Error al buscar en Google Sheets" },
      { status: 502 }
    );
  }
}
