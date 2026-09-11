import { NextResponse } from "next/server";
import { saveProductAsync, slugify, Product } from "@/lib/db";
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
    const data = await req.json();
    const name = (data.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { success: false, message: "El nombre es obligatorio." },
        { status: 400 }
      );
    }

    let categoryId = data.categoryId;
    let newCategory: { id: string; name: string; icon?: string } | undefined = undefined;

    if (data.newCategoryName && data.newCategoryName.trim()) {
      categoryId = "cat_" + slugify(data.newCategoryName.trim());
      newCategory = {
        id: categoryId,
        name: data.newCategoryName.trim(),
        icon: data.newCategoryIcon || "🍽️",
      };
    } else if (!categoryId) {
      categoryId = "pizzas";
    }

    const ingredients = Array.isArray(data.ingredients)
      ? data.ingredients
      : String(data.ingredients || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    const recipe = Array.isArray(data.recipe)
      ? data.recipe
          .filter((r: any) => r && r.barcode && Number(r.qty) > 0)
          .map((r: any) => ({
            barcode: String(r.barcode),
            name: String(r.name || r.barcode),
            qty: Number(r.qty) || 1,
            unit: r.unit || undefined,
          }))
      : [];

    const productId = data.id !== undefined && data.id !== null && data.id !== ""
      ? Number(data.id)
      : Date.now();

    const product: Product = {
      id: productId,
      categoryId: categoryId,
      name: name,
      description: data.description || "",
      ingredients: ingredients,
      price: parseFloat(data.price) || 0,
      badge: data.badge || undefined,
      rating: data.rating || undefined,
      prepTime: data.prepTime || undefined,
      image: data.image || null,
      recipe: recipe.length > 0 ? recipe : undefined,
    };

    const result = await saveProductAsync(product, newCategory);

    return NextResponse.json({
      success: true,
      product: result.product,
      categories: result.categories,
    });
  } catch (e: any) {
    console.error("[POST /api/menu/product Error]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
