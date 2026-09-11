import { NextResponse } from "next/server";
import {
  createInventoryItemAsync,
  generateId,
  todayISO,
  slugify,
  recalcStock,
  InventoryItem,
  sheetsLookupBarcode,
  sheetsAdjustStock,
  sheetsCreateProduct,
  createExpenseAsync,
} from "@/lib/db";
import { isAdminOrOwner } from "@/lib/roles";

export async function POST(req: Request) {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const name = (data.name || "").trim();
    const parsedQty = parseFloat(data.qty) || 0;
    const parsedCost = parseFloat(data.cost) || 0;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "El nombre es obligatorio." },
        { status: 400 }
      );
    }

    // Barcode present → this product belongs to the Google Sheets stock.
    if (data.barcode) {
      const barcode = String(data.barcode).trim();
      const lookup = await sheetsLookupBarcode(barcode);

      if (lookup.found) {
        const result = await sheetsAdjustStock(barcode, parsedQty, data.expirationDate || null);
        if (!result.success) {
          return NextResponse.json(
            { success: false, message: result.message || "No se pudo actualizar en Google Sheets." },
            { status: 400 }
          );
        }
      } else {
        const parsedMinAlert =
          data.minAlert !== undefined && data.minAlert !== null && data.minAlert !== ""
            ? parseInt(data.minAlert, 10)
            : 15;
        const result = await sheetsCreateProduct({
          barcode,
          name,
          category: data.category || "Otros",
          unit: data.unit || "unidades",
          stock: parsedQty,
          expirationDate: data.expirationDate || null,
          minAlert: parsedMinAlert,
        });
        if (!result.success) {
          return NextResponse.json(
            { success: false, message: result.message || "No se pudo crear en Google Sheets." },
            { status: 400 }
          );
        }
      }

      if (parsedCost > 0) {
        await createExpenseAsync({
          id: generateId("exp"),
          date: todayISO(),
          description: "Compra de stock: " + name,
          amount: parsedCost,
          category: "stock",
          source: "stock_entry",
        });
      }

      return NextResponse.json({ success: true, mergedIntoSheets: true });
    }

    // Kitchen ingredient / local stock item -> Saved into PostgreSQL
    const item: InventoryItem = {
      id: "prod_" + slugify(name) + "_" + Date.now().toString(36),
      name: name,
      category: data.category || "Otros",
      unit: data.unit || "unidades",
      minAlert:
        data.minAlert !== undefined && data.minAlert !== null && data.minAlert !== ""
          ? parseInt(data.minAlert, 10)
          : 15,
      icon: data.icon || "📦",
      barcode: null,
      stock: 0,
      lots: [],
    };

    if (parsedQty > 0) {
      item.lots.push({
        id: generateId("lot"),
        qty: parsedQty,
        expirationDate: data.expirationDate || null,
        addedDate: todayISO(),
      });
      recalcStock(item);
    }

    const result = await createInventoryItemAsync(item, parsedCost);
    return NextResponse.json({ success: true, item: result.item });
  } catch (e: any) {
    console.error("[POST /api/inventory/create Error]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
