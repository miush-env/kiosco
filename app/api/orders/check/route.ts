import { NextResponse } from "next/server";
import { getOrderByIdAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID de pedido requerido" }, { status: 400 });
    }

    const order = await getOrderByIdAsync(id);
    if (!order) {
      return NextResponse.json({ success: false, message: "Pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: order.status,
      order: {
        id: order.id,
        date: order.date,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        deliveryType: order.deliveryType,
        items: order.items,
        total: order.total,
        paymentMethod: order.paymentMethod,
        transferRef: order.transferRef,
        receiptImage: order.receiptImage ? true : false,
        status: order.status,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/orders/check error]", err.message);
    return NextResponse.json({ success: false, message: "Error al consultar estado" }, { status: 500 });
  }
}
