import { NextResponse } from "next/server";
import { createOrderAsync, generateId, todayISO, validateOrderStock, deductIngredientsForOrder } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, customerName, customerPhone, customerAddress, deliveryType, total, transferRef, receiptImage } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "El carrito está vacío." }, { status: 400 });
    }

    if (!customerName || !customerPhone) {
      return NextResponse.json({ success: false, message: "Nombre y teléfono son obligatorios." }, { status: 400 });
    }

    if (!receiptImage) {
      return NextResponse.json({ success: false, message: "Es obligatorio adjuntar la foto del comprobante de transferencia." }, { status: 400 });
    }

    // Validate available stock before registering order
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
      paymentMethod: "transferencia" as const,
      transferRef: transferRef ? String(transferRef).trim() : undefined,
      receiptImage: receiptImage || undefined,
      status: "pendiente" as const, // En espera de validación bancaria del dueño
    };

    const created = await createOrderAsync(newOrder);
    if (!created) {
      return NextResponse.json({ success: false, message: "Error al registrar el pedido." }, { status: 500 });
    }

    // Deduct stock immediately so no one else can order the same items
    await deductIngredientsForOrder(items);

    return NextResponse.json({
      success: true,
      orderId,
      order: newOrder,
      message: "Pedido por transferencia registrado exitosamente. En espera de acreditación.",
    });
  } catch (err: any) {
    console.error("[POST /api/orders/transfer error]", err.message);
    return NextResponse.json({ success: false, message: "Error interno del servidor." }, { status: 500 });
  }
}
