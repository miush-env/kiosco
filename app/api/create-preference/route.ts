import { NextResponse } from "next/server";
import {
  deductIngredientsForOrder,
  createMercadoPagoPreference,
  validateOrderStock,
  createOrderAsync,
  createSaleAsync,
  generateId,
  todayISO,
} from "@/lib/db";

export async function POST(req: Request) {
  try {
    const order = await req.json();

    const activeToken =
      order.accessToken ||
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN;
    if (!activeToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Falta configurar MERCADOPAGO_ACCESS_TOKEN en .env.local con tu access token de Mercado Pago.",
        },
        { status: 500 }
      );
    }
    const cleanToken = String(activeToken).replace(/^["']|["']$/g, "").trim();
    const stockCheck = await validateOrderStock(order.items);
    if (!stockCheck.ok) {
      return NextResponse.json({ success: false, error: stockCheck.message }, { status: 400 });
    }

    const rawHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const rawProto = req.headers.get("x-forwarded-proto") || "https";

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kiosco-update.vercel.app";
    if (
      rawHost &&
      !rawHost.includes("localhost") &&
      !rawHost.includes("127.0.0.1") &&
      !rawHost.startsWith("192.168.")
    ) {
      baseUrl = `${rawProto}://${rawHost}`;
    }

    const orderId = generateId("ord");
    const cartTotal = (order.items || []).reduce(
      (sum: number, i: any) => sum + parseFloat(i.price || 0) * parseInt(i.quantity || 1, 10),
      0
    );

    // Format items for Mercado Pago with product picture URL
    const mpItems = (order.items || []).map((item: any) => {
      let pictureUrl = `${baseUrl}/assets/images/products/prod_mtw3dkp6_0pea6j.jpg`;
      if (item.image) {
        pictureUrl = item.image.startsWith("http")
          ? item.image
          : `${baseUrl}${item.image.startsWith("/") ? "" : "/"}${item.image}`;
      }

      return {
        id: String(item.id || item.cartId || "1"),
        title: item.name || "Pancho Pizza Alakary",
        description: item.comment
          ? `Nota: ${item.comment}`
          : item.description || "Comida artesanal Alakary",
        picture_url: pictureUrl,
        quantity: parseInt(item.quantity || 1, 10),
        unit_price: parseFloat(item.price || 0),
        currency_id: "ARS",
      };
    });

    const preferencePayload = {
      items: mpItems,
      payer: {
        name: (order.customerName || "Cliente").slice(0, 30),
        phone: {
          number: String(order.customerPhone || "").replace(/[^\d]/g, "").slice(0, 15) || "1172570867",
        },
        address: {
          street_name: (order.customerAddress || "Paderewski 3666").slice(0, 80),
        },
      },
      back_urls: {
        success: `${baseUrl}/?payment=success&orderId=${orderId}`,
        pending: `${baseUrl}/?payment=pending&orderId=${orderId}`,
        failure: `${baseUrl}/?payment=failure&orderId=${orderId}`,
      },
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      auto_return: "approved",
      statement_descriptor: "ALAKARY",
      external_reference: orderId,
    };

    const mpResponse = await createMercadoPagoPreference(preferencePayload, cleanToken);

    // 1. Record order in orders table as 'iniciado' (pending payment confirmation)
    // Only after payment is approved by webhook/verification will it change to 'aprobado' and appear in panel & sales!
    await createOrderAsync({
      id: orderId,
      date: todayISO(),
      customerName: String(order.customerName || "Cliente Online").trim(),
      customerPhone: String(order.customerPhone || "").trim(),
      customerAddress: order.customerAddress ? String(order.customerAddress).trim() : undefined,
      deliveryType: order.deliveryType === "retiro" ? "retiro" : "envio",
      items: (order.items || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        price: Number(i.price || 0),
        quantity: Number(i.quantity || 1),
        comment: i.comment || undefined,
        linkedInventoryId: i.linkedInventoryId || undefined,
      })),
      total: cartTotal,
      paymentMethod: "mercadopago",
      status: "iniciado",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      id: mpResponse.id,
      init_point: mpResponse.init_point,
      sandbox_init_point: mpResponse.sandbox_init_point,
      orderId,
    });
  } catch (err: any) {
    console.error("[MercadoPago Error]", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Error al generar la preferencia de Mercado Pago",
        details: err,
      },
      { status: 500 }
    );
  }
}
