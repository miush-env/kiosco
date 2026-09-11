import { NextResponse } from "next/server";
import {
  deductIngredientsForOrder,
  createSaleAsync,
  generateId,
  todayISO,
  validateOrderStock,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { items, total, paymentMethod } = await req.json();

    const stockCheck = await validateOrderStock(items);
    if (!stockCheck.ok) {
      return NextResponse.json({ success: false, message: stockCheck.message }, { status: 400 });
    }

    await deductIngredientsForOrder(items);

    const computedTotal =
      typeof total === "number" && total > 0
        ? total
        : (items || []).reduce(
            (sum: number, i: any) => sum + (i.price || 0) * (i.quantity || 1),
            0
          );

    if (computedTotal > 0) {
      await createSaleAsync({
        id: generateId("sale"),
        date: todayISO(),
        items: (items || []).map((i: any) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        total: computedTotal,
        paymentMethod: paymentMethod || "whatsapp",
        source: "cart",
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

