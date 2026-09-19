import { formatMoney } from "./formatters";
import { CartItem } from "@/components/modals/CartModal";

export interface OrderDataPayload {
  orderId?: string;
  customerName: string;
  customerPhone?: string;
  deliveryType: "envio" | "retiro";
  customerAddress?: string;
  paymentMethod: "efectivo" | "mercadopago";
  items: CartItem[];
  total: number;
  deliveryCost: number;
  cashAmountGiven?: string;
  cashChangeOption?: "exact" | "change";
  pickupCode?: string;
}

export function buildOrderWhatsAppMessage(
  order: OrderDataPayload,
  storeName: string = "Alakary",
  storeAddress: string = "Paderewski 3666"
): string {
  let msg = "";
  if (order.deliveryType === "retiro") {
    msg += `🍕 *NUEVO PEDIDO PARA RETIRAR — ${storeName}*\n\n`;
    if (order.orderId) msg += `🆔 *Pedido:* #${order.orderId.slice(-6).toUpperCase()}\n`;
    if (order.pickupCode) msg += `🔑 *Código de Retiro:* #${order.pickupCode}\n`;
    msg += `👤 *Cliente:* ${order.customerName}\n`;
    if (order.customerPhone) msg += `📱 *Teléfono:* ${order.customerPhone}\n`;
    msg += `📍 *Modalidad:* Retiro en el Local (${storeAddress})\n\n`;
    msg += `*Detalle del pedido:*\n`;
    order.items.forEach((item) => {
      msg += `• *${item.quantity}x* ${item.name} — $${formatMoney(item.price * item.quantity)}\n`;
      if (item.comment) msg += `  _(Nota: ${item.comment})_\n`;
    });
    msg += `\n🏬 *Retiro:* En local (Gratis)\n`;
    msg += `💰 *TOTAL A PAGAR AL RETIRAR:* $${formatMoney(order.total)}\n`;
  } else if (order.paymentMethod === "mercadopago") {
    msg += `🍕 *NUEVO PEDIDO A DOMICILIO — ${storeName}*\n\n`;
    if (order.orderId) msg += `🆔 *Pedido:* #${order.orderId.slice(-6).toUpperCase()}\n`;
    msg += `👤 *Cliente:* ${order.customerName}\n`;
    if (order.customerPhone) msg += `📱 *Teléfono:* ${order.customerPhone}\n`;
    msg += `📍 *Modalidad:* Envío a Domicilio\n`;
    msg += `🏠 *Dirección:* ${order.customerAddress}\n`;
    msg += `💳 *Medio de pago:* Mercado Pago (Transferencia / Link)\n`;
    msg += `🔗 *Link:* https://link.mercadopago.com.ar/bautistasanchez\n\n`;
    msg += `*Detalle del pedido:*\n`;
    order.items.forEach((item) => {
      msg += `• *${item.quantity}x* ${item.name} — $${formatMoney(item.price * item.quantity)}\n`;
      if (item.comment) msg += `  _(Nota: ${item.comment})_\n`;
    });

    if (order.deliveryCost > 0) msg += `\n🛵 *Envío:* $${formatMoney(order.deliveryCost)}\n`;
    else msg += `\n🛵 *Envío:* ¡Gratis!\n`;
    msg += `\n💰 *TOTAL A TRANSFERIR:* $${formatMoney(order.total)}\n`;
    msg += `\n📎 _(Te envío el comprobante de transferencia a continuación)_`;
  } else {
    const numCashGiven = parseFloat((order.cashAmountGiven || "").replace(/[^0-9.]/g, "")) || 0;
    msg += `🍕 *NUEVO PEDIDO A DOMICILIO — ${storeName}*\n\n`;
    if (order.orderId) msg += `🆔 *Pedido:* #${order.orderId.slice(-6).toUpperCase()}\n`;
    msg += `👤 *Cliente:* ${order.customerName}\n`;
    if (order.customerPhone) msg += `📱 *Teléfono:* ${order.customerPhone}\n`;
    msg += `📍 *Modalidad:* Envío a Domicilio\n`;
    msg += `🏠 *Dirección:* ${order.customerAddress}\n`;

    const cashChangeDue = Math.max(0, numCashGiven - order.total);
    if (order.cashChangeOption === "change" && numCashGiven >= order.total) {
      msg += `💳 *Medio de pago:* Efectivo (Paga con: $${formatMoney(numCashGiven)} — Vuelto: $${formatMoney(cashChangeDue)} 💵)\n`;
    } else {
      msg += `💳 *Medio de pago:* Efectivo (Monto exacto / Sin vuelto 💵)\n`;
    }

    msg += `\n*Detalle del pedido:*\n`;
    order.items.forEach((item) => {
      msg += `• *${item.quantity}x* ${item.name} — $${formatMoney(item.price * item.quantity)}\n`;
      if (item.comment) msg += `  _(Nota: ${item.comment})_\n`;
    });

    if (order.deliveryCost > 0) msg += `\n🛵 *Envío:* $${formatMoney(order.deliveryCost)}\n`;
    else msg += `\n🛵 *Envío:* ¡Gratis!\n`;
    msg += `\n💰 *TOTAL:* $${formatMoney(order.total)}\n`;
  }
  return msg;
}

export function buildMPWhatsAppMessage(order: any, storeName: string = "Alakary"): string {
  if (!order) return "";
  let msg = `🍕 *PEDIDO PAGADO POR MERCADO PAGO — ${storeName}*\n\n`;
  if (order.id) msg += `🆔 *Pedido:* #${order.id.slice(-6).toUpperCase()}\n`;
  if (order.customerName) msg += `👤 *Cliente:* ${order.customerName}\n`;
  if (order.customerPhone) msg += `📱 *Teléfono:* ${order.customerPhone}\n`;
  msg += `📍 *Modalidad:* ${order.deliveryType === "retiro" ? "Retiro en Local" : "Envío a Domicilio"}\n`;
  if (order.customerAddress && order.deliveryType !== "retiro") {
    msg += `🏠 *Dirección:* ${order.customerAddress}\n`;
  }
  msg += `💳 *Medio de pago:* Mercado Pago (Acreditado / Pagado Online ✅)\n`;
  msg += `\n*Detalle del pedido:*\n`;

  (order.items || []).forEach((item: any) => {
    const q = item.quantity || 1;
    const p = item.price || 0;
    msg += `• *${q}x* ${item.name || "Producto"} — $${formatMoney(p * q)}\n`;
    if (item.comment) msg += `  _(Nota: ${item.comment})_\n`;
  });

  if (order.total) msg += `\n💰 *TOTAL PAGADO:* $${formatMoney(order.total)}\n`;
  msg += `\n✅ _¡Ya realicé el pago por Mercado Pago! Envío este mensaje para confirmar mi pedido y comenzar la preparación._`;
  return msg;
}

export function getMPWhatsAppUrl(
  order: any,
  whatsappNumber: string = "+5491172570867",
  storeName: string = "Alakary"
): string {
  const cleanNum = whatsappNumber.replace(/[^\d]/g, "");
  const msg = buildMPWhatsAppMessage(order, storeName);
  return `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`;
}
