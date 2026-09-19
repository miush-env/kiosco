import { NextResponse } from "next/server";
import {
  getOrdersAsync,
  createOrderAsync,
  createSaleAsync,
  clearOrdersAsync,
  generateId,
  todayISO,
  validateOrderStock,
  deductIngredientsForOrder,
} from "@/lib/db";
import { getRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const role = await getRole();
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
    }

    const rawOrders = await getOrdersAsync();
    // Only return confirmed orders (Cash pending/approved/rejected, or Mercado Pago approved/rejected)
    // Exclude 'iniciado' orders where checkout was started but never paid
    const orders = rawOrders.filter((o: any) => o.status !== "iniciado" && o.status !== "pendiente_pago");
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    console.error("[GET /api/orders error]", err.message);
    return NextResponse.json({ success: false, message: "Error al cargar pedidos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, customerName, customerPhone, customerAddress, deliveryType, total, paymentMethod, transferRef } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "El carrito está vacío." }, { status: 400 });
    }

    if (!customerName || !customerPhone) {
      return NextResponse.json({ success: false, message: "Nombre y teléfono son obligatorios." }, { status: 400 });
    }

    const stockValidation = await validateOrderStock(items);
    if (!stockValidation.ok) {
      return NextResponse.json({ success: false, message: stockValidation.message }, { status: 400 });
    }

    const orderId = generateId("ord");
    const newOrder = {
      id: orderId,
      date: todayISO(),
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      customerAddress: customerAddress ? String(customerAddress).trim() : undefined,
      deliveryType: deliveryType === "retiro" ? ("retiro" as const) : ("envio" as const),
      items: items.map((i: any) => ({
        id: i.id,
        name: i.name,
        price: Number(i.price || 0),
        quantity: Number(i.quantity || 1),
        comment: i.comment || undefined,
        linkedInventoryId: i.linkedInventoryId || undefined,
      })),
      total: Number(total || 0),
      paymentMethod: paymentMethod || "efectivo",
      transferRef: transferRef ? String(transferRef).trim() : undefined,
      status: "pendiente" as const,
    };

    await createOrderAsync(newOrder);
    await deductIngredientsForOrder(items);

    return NextResponse.json({ success: true, orderId, order: newOrder });
  } catch (err: any) {
    console.error("[POST /api/orders error]", err.message);
    return NextResponse.json({ success: false, message: "Error interno al crear pedido" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const role = await getRole();
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
    }

    await clearOrdersAsync();
    return NextResponse.json({ success: true, message: "Historial de pedidos limpiado correctamente." });
  } catch (err: any) {
    console.error("[DELETE /api/orders error]", err.message);
    return NextResponse.json({ success: false, message: "Error al limpiar pedidos" }, { status: 500 });
  }
}

