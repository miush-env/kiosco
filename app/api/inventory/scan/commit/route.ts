import { NextResponse } from "next/server";
import { sheetsAdjustStock, sheetsCreateProduct } from "@/lib/db";
import { isAdminOrOwner } from "@/lib/roles";

export async function POST(req: Request) {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (body.action !== "adjustStock" && body.action !== "createProduct") {
      return NextResponse.json({ success: false, message: "Acción inválida." }, { status: 400 });
    }
    const barcode = String(body.barcode || "").trim();
    if (!barcode) {
      return NextResponse.json({ success: false, message: "Falta el código de barras." }, { status: 400 });
    }

    if (body.action === "adjustStock") {
      const result = await sheetsAdjustStock(barcode, Number(body.qty) || 0, body.expirationDate || null);
      return NextResponse.json(result);
    }

    const result = await sheetsCreateProduct({
      barcode,
      name: body.name,
      category: body.category,
      unit: body.unit,
      stock: body.stock,
      expirationDate: body.expirationDate || null,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Error al guardar en Google Sheets" },
      { status: 502 }
    );
  }
}
