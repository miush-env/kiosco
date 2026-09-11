import { NextResponse } from "next/server";
import {
  addLotAsync,
  getMergedInventory,
  sheetsAdjustStock,
  generateId,
  todayISO,
  createExpenseAsync,
} from "@/lib/db";
import { isAdminOrOwner } from "@/lib/roles";

export async function POST(req: Request) {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  try {
    const { id, name, qty, expirationDate, cost } = await req.json();
    const parsedQty = parseFloat(qty) || 0;
    if (!id || parsedQty <= 0) {
      return NextResponse.json(
        { success: false, message: "Datos inválidos (ID y cantidad requeridos)." },
        { status: 400 }
      );
    }

    const parsedCost = parseFloat(cost) || 0;

    // Sheets-sourced item (id is "sheets_<barcode>")
    if (typeof id === "string" && id.startsWith("sheets_")) {
      const barcode = id.slice("sheets_".length);
      const result = await sheetsAdjustStock(barcode, parsedQty, expirationDate || null);
      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message || "No se pudo agregar el lote." },
          { status: 400 }
        );
      }

      if (parsedCost > 0) {
        await createExpenseAsync({
          id: generateId("exp"),
          date: todayISO(),
          description: "Compra de stock: " + (name || result.product?.name || barcode),
          amount: parsedCost,
          category: "stock",
          source: "stock_entry",
        });
      }

      const merged = await getMergedInventory();
      const item = merged.inventory.find((i) => i.id === id);
      return NextResponse.json({ success: true, item, stats: merged.stats });
    }

    // PostgreSQL Inventory Item
    const result = await addLotAsync(id, parsedQty, expirationDate || null, parsedCost, name);
    return NextResponse.json({ success: true, item: result.item, stats: result.stats });
  } catch (e: any) {
    console.error("[POST /api/inventory/add-lot Error]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
