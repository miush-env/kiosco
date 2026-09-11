import { NextResponse } from "next/server";
import { getOrderByIdAsync, updateOrderStatusAsync, deductIngredientsForOrder } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { orderId, paymentId, collectionStatus } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, message: "orderId requerido" }, { status: 400 });
    }

    const order = await getOrderByIdAsync(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Pedido no encontrado" }, { status: 404 });
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    const cleanToken = token ? String(token).replace(/^["']|["']$/g, "").trim() : "";

    let isApproved = false;

    if (paymentId && cleanToken) {
      try {
        const mpRes = await fetch("https://api.mercadopago.com/v1/payments/" + paymentId, {
          headers: {
            Authorization: "Bearer " + cleanToken,
          },
        });
        if (mpRes.ok) {
          const payment = await mpRes.json();
          if (payment.status === "approved" && payment.external_reference === orderId) {
            isApproved = true;
          } else if (payment.status === "rejected" || payment.status === "cancelled") {
            await updateOrderStatusAsync(orderId, "rechazado");
            return NextResponse.json({ success: false, status: payment.status, message: "Pago rechazado o cancelado" });
          }
        }
      } catch (err) {
        console.warn("[Verify MP Payment API Warning]", err);
      }
    }

    // Fallback: if collectionStatus was passed as approved
    if (!isApproved && collectionStatus === "approved") {
      isApproved = true;
    }

    if (isApproved) {
      if (order.status !== "aprobado") {
        await deductIngredientsForOrder(order.items);
        await updateOrderStatusAsync(orderId, "aprobado");
      }
      return NextResponse.json({ success: true, status: "aprobado", order: { ...order, status: "aprobado" } });
    }

    return NextResponse.json({ success: false, status: order.status, message: "El pago aún no ha sido confirmado por Mercado Pago" });
  } catch (err: any) {
    console.error("[POST /api/orders/confirm-mp-payment error]", err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
