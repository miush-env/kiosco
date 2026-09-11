import { NextResponse } from "next/server";
import { getOrderByIdAsync, updateOrderStatusAsync, deductIngredientsForOrder } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
    let topic = url.searchParams.get("type") || url.searchParams.get("topic");

    let body: any = {};
    try {
      body = await req.json();
      if (!paymentId && body.data?.id) {
        paymentId = String(body.data.id);
      }
      if (!paymentId && body.id) {
        paymentId = String(body.id);
      }
      if (!topic && body.type) {
        topic = body.type;
      }
      if (!topic && body.action) {
        topic = body.action;
      }
    } catch {
      // Body may be empty
    }

    console.log("[MercadoPago Webhook] Received notification: ID=" + paymentId + ", Topic=" + topic);

    if (!paymentId) {
      return NextResponse.json({ received: true, message: "No payment ID found" }, { status: 200 });
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    if (!token) {
      console.error("[MercadoPago Webhook] Missing MERCADOPAGO_ACCESS_TOKEN");
      return NextResponse.json({ received: true, error: "Missing token" }, { status: 200 });
    }
    const cleanToken = String(token).replace(/^["']|["']$/g, "").trim();

    // Query Mercado Pago API to verify payment status
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments/" + paymentId, {
      headers: {
        Authorization: "Bearer " + cleanToken,
      },
    });

    if (!mpRes.ok) {
      console.warn("[MercadoPago Webhook] Failed to fetch payment " + paymentId + ": " + mpRes.statusText);
      return NextResponse.json({ received: true, warning: "Payment fetch failed" }, { status: 200 });
    }

    const payment = await mpRes.json();
    const orderId = payment.external_reference;
    const paymentStatus = payment.status; // 'approved', 'rejected', 'cancelled', 'in_process', etc.

    console.log("[MercadoPago Webhook] Payment " + paymentId + " for Order " + orderId + ": status=" + paymentStatus);

    if (orderId) {
      const existingOrder = await getOrderByIdAsync(orderId);
      if (existingOrder) {
        if (paymentStatus === "approved") {
          if (existingOrder.status !== "aprobado") {
            await deductIngredientsForOrder(existingOrder.items);
            await updateOrderStatusAsync(orderId, "aprobado");
            console.log("[MercadoPago Webhook] Order " + orderId + " successfully APPROVED and registered in Finanzas!");
          }
        } else if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
          if (existingOrder.status !== "rechazado") {
            await updateOrderStatusAsync(orderId, "rechazado");
            console.log("[MercadoPago Webhook] Order " + orderId + " marked as REJECTED/CANCELLED");
          }
        }
      }
    }

    return NextResponse.json({ received: true, status: paymentStatus, orderId }, { status: 200 });
  } catch (err: any) {
    console.error("[MercadoPago Webhook Error]", err);
    return NextResponse.json({ received: true, error: err.message }, { status: 200 });
  }
}
