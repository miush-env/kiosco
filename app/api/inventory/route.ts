import { NextResponse } from "next/server";
import {
  getInventoryAsync,
  saveInventoryAsync,
  getMergedInventory,
  sheetsAdjustStock,
  adjustInventoryStockFast,
  InventoryItem,
} from "@/lib/db";
import { isAdminOrOwner } from "@/lib/roles";

export async function GET() {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  const { inventory, stats } = await getMergedInventory();
  return NextResponse.json({ success: true, inventory, stats });
}

export async function POST(req: Request) {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  try {
    const { id, delta, setStock } = await req.json();

    // Sheets-sourced item (id is "sheets_<barcode>")
    if (typeof id === "string" && id.startsWith("sheets_")) {
      const barcode = id.slice("sheets_".length);
      const mergedBefore = await getMergedInventory();
      const currentItem = mergedBefore.inventory.find((i) => i.id === id);
      const currentStock = currentItem ? currentItem.stock : 0;
      let qty = 0;
      if (typeof setStock === "number") {
        qty = setStock - currentStock;
      } else if (typeof delta === "number") {
        qty = delta;
      }
      const result = await sheetsAdjustStock(barcode, qty);
      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message || "No se pudo actualizar el stock." },
          { status: 400 }
        );
      }

      const merged = await getMergedInventory();
      const item = merged.inventory.find((i) => i.id === id);
      return NextResponse.json({ success: true, item, stats: merged.stats });
    }

    // Inventory item - Ultra-fast targeted update
    const result = await adjustInventoryStockFast(id, delta, setStock);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Insumo no encontrado o no se pudo actualizar." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item: result.item, stats: result.stats });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: "ID requerido." }, { status: 400 });
    }
    const { deleteInventoryItemAsync } = await import("@/lib/db");
    await deleteInventoryItemAsync(id);
    const merged = await getMergedInventory();
    return NextResponse.json({ success: true, stats: merged.stats });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
