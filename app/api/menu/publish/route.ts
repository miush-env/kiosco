import { NextResponse } from "next/server";
import { loadProductsFile, saveProductsFile } from "@/lib/db";
import { isAdminOrOwner } from "@/lib/roles";

export async function POST(req: Request) {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  try {
    const { inventoryItemId, name, price } = await req.json();
    const parsedPrice = parseFloat(price);
    const itemName = (name || "").trim();

    if (!inventoryItemId || !itemName || !parsedPrice || parsedPrice <= 0) {
      return NextResponse.json(
        { success: false, message: "Faltan datos (producto o precio)." },
        { status: 400 }
      );
    }

    const invItem = { id: inventoryItemId, name: itemName };

    const productsData = loadProductsFile();
    if (!Array.isArray(productsData.categories)) productsData.categories = [];
    if (!Array.isArray(productsData.products)) productsData.products = [];

    const CATEGORY_ID = "bebidas-snacks";
    if (!productsData.categories.some((c) => c.id === CATEGORY_ID)) {
      productsData.categories.push({
        id: CATEGORY_ID,
        name: "Bebidas y Snacks",
        icon: "🥤",
      });
    }

    let menuItem = productsData.products.find(
      (p) => p.linkedInventoryId === invItem.id
    );
    if (menuItem) {
      menuItem.price = parsedPrice;
      menuItem.name = invItem.name;
    } else {
      menuItem = {
        id: Date.now(),
        categoryId: CATEGORY_ID,
        name: invItem.name,
        description: "",
        ingredients: [],
        price: parsedPrice,
        linkedInventoryId: invItem.id,
        image: null,
      };
      productsData.products.push(menuItem);
    }

    saveProductsFile(productsData);
    return NextResponse.json({ success: true, product: menuItem });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
