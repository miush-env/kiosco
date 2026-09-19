"use client";

import React from "react";
import {
  Utensils,
  Clock,
  CheckCircle2,
  Ban,
  CreditCard,
  Store,
  MapPin,
  Calendar,
  Pizza,
  Check,
  Copy,
  X,
  Trash2,
  ExternalLink,
  Share2,
} from "lucide-react";
import { Order, formatMoney, parseOrderItems } from "@/types/panel";

interface OrderCardProps {
  order: Order;
  updatingOrderId: string | null;
  copiedOrderId: string | null;
  onUpdateStatus: (orderId: string, status: "aprobado" | "rechazado") => void;
  onCopyPhone: (phone: string, orderId: string) => void;
  onViewReceipt: (image: string) => void;
  onShareWhatsApp: (order: Order) => void;
}

export default function OrderCard({
  order,
  updatingOrderId,
  copiedOrderId,
  onUpdateStatus,
  onCopyPhone,
  onViewReceipt,
  onShareWhatsApp,
}: OrderCardProps) {
  const isPending = order.status === "pendiente";
  const isApproved = order.status === "aprobado";
  const isRejected = order.status === "rechazado";
  const isMP = order.paymentMethod === "mercadopago";
  const isCash = order.paymentMethod === "efectivo" || !order.paymentMethod;
  const isPickup = order.deliveryType === "retiro";
  const shortId = order.id.slice(-6).toUpperCase();
  const itemsList = parseOrderItems(order.items);
  const timeString = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div
      style={{
        background: "var(--adm-surface)",
        borderColor: isRejected
          ? "rgba(239, 68, 68, 0.4)"
          : isPending
            ? "rgba(245, 158, 11, 0.4)"
            : "var(--adm-border)",
      }}
      className={`border rounded-2xl p-4 shadow-xs space-y-3 transition-all ${isRejected ? "opacity-85" : ""}`}
    >
      {/* 1. Header: Avatar + Cliente e ID + Precio */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Cloche Avatar Badge */}
          <div
            style={{
              background: isRejected ? "rgba(239, 68, 68, 0.15)" : "#064e3b",
              color: isRejected ? "#ef4444" : "#6ee7b7",
            }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
          >
            <Utensils className="w-5.5 h-5.5" />
          </div>

          <div>
            <h3 style={{ color: "var(--adm-text-main)" }} className="text-lg font-black tracking-tight leading-tight">
              {order.customerName}
            </h3>
            <span style={{ color: "var(--adm-text-muted)" }} className="font-mono text-xs font-medium mt-0.5 block">
              #{shortId}
            </span>
          </div>
        </div>

        {/* Precio Total */}
        <div className="text-right shrink-0">
          <div style={{ color: "var(--adm-text-main)" }} className="text-2xl font-black leading-none">
            ${formatMoney(order.total)}
          </div>
        </div>
      </div>

      {/* 2. Badges: Estado / Pago + Código de Retiro */}
      <div className="flex items-center gap-2 flex-wrap">
        {isCash ? (
          isPending ? (
            <span
              style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.4)" }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
            >
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Efectivo Pendiente</span>
            </span>
          ) : isApproved ? (
            <span
              style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.4)" }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Efectivo Cobrado</span>
            </span>
          ) : (
            <span
              style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)" }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancelado</span>
            </span>
          )
        ) : isMP ? (
          isPending ? (
            <span
              style={{ background: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9", borderColor: "rgba(14, 165, 233, 0.4)" }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
            >
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Mercado Pago — Pendiente</span>
            </span>
          ) : isApproved ? (
            <span
              style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.4)" }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Mercado Pago — Cobrado</span>
            </span>
          ) : (
            <span
              style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)" }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Mercado Pago — Rechazado</span>
            </span>
          )
        ) : (
          <span
            style={{ background: "var(--adm-surface-subtle)", color: "var(--adm-text-main)", borderColor: "var(--adm-border)" }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{String(order.paymentMethod || "Pedido").toUpperCase()}</span>
          </span>
        )}

        {isPickup && order.transferRef && (
          <span
            style={{ background: "rgba(20, 184, 166, 0.15)", color: "#14b8a6", borderColor: "rgba(20, 184, 166, 0.4)" }}
            className="inline-flex items-center text-xs font-mono font-bold px-2.5 py-1 rounded-md border"
          >
            #{order.transferRef}
          </span>
        )}

        {/* Share WhatsApp Dispatch */}
        <button
          type="button"
          onClick={() => onShareWhatsApp(order)}
          title="Compartir comanda con repartidor por WhatsApp"
          className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-600/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Comanda</span>
        </button>
      </div>

      {/* 3. Modalidad & Fecha */}
      <div style={{ color: "var(--adm-text-muted)" }} className="flex items-center gap-2 text-xs font-medium flex-wrap">
        {isPickup ? (
          <span style={{ color: "var(--adm-text-main)" }} className="inline-flex items-center gap-1 font-semibold">
            <Store className="w-3.5 h-3.5 opacity-70" />
            <span>Retiro en local</span>
          </span>
        ) : (
          <span style={{ color: "var(--adm-text-main)" }} className="inline-flex items-center gap-1 font-semibold">
            <MapPin className="w-3.5 h-3.5 opacity-70" />
            <span>{order.customerAddress || "Sin dirección"}</span>
          </span>
        )}

        <span className="opacity-40 font-light">•</span>

        <div className="flex items-center gap-1 opacity-80">
          <Calendar className="w-3.5 h-3.5" />
          <span>{order.date || "Hoy"} · {timeString || "14:15"}</span>
        </div>
      </div>

      {/* 4. Productos List */}
      <div style={{ borderColor: "var(--adm-border-subtle)" }} className="border-t pt-3 space-y-2.5">
        {itemsList.map((item: any, idx: number) => {
          const qty = item.quantity || item.qty || 1;
          const name = item.name || item.title || "Producto";
          const price = item.price ? Number(item.price) * Number(qty) : 0;
          const desc = item.description || item.comment || "";
          const image = item.image || item.imageUrl || null;

          return (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {image ? (
                  <img
                    src={image}
                    alt={name}
                    style={{ borderColor: "var(--adm-border)", background: "var(--adm-surface-subtle)" }}
                    className="w-11 h-11 rounded-2xl object-cover border shrink-0"
                  />
                ) : (
                  <div
                    style={{ background: "rgba(249, 115, 22, 0.15)", borderColor: "rgba(249, 115, 22, 0.3)", color: "#f97316" }}
                    className="w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0"
                  >
                    <Pizza className="w-5.5 h-5.5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 style={{ color: "var(--adm-text-main)" }} className="text-sm font-black leading-snug truncate">
                    {qty}x {name}
                  </h4>
                  {desc && (
                    <p style={{ color: "var(--adm-text-muted)" }} className="text-xs font-medium truncate mt-0.5">
                      {desc}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ color: "var(--adm-text-main)" }} className="text-sm font-black shrink-0">
                ${formatMoney(price)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Comprobante de Transferencia (si existe) */}
      {order.receiptImage && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onViewReceipt(order.receiptImage!)}
            className="w-full py-2 px-3 text-xs font-bold text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Comprobante de Transferencia Adjunto</span>
          </button>
        </div>
      )}

      {/* 6. WhatsApp Cliente Row */}
      {order.customerPhone && (
        <div
          style={{ background: "var(--adm-surface-subtle)", borderColor: "var(--adm-border)" }}
          className="my-2 border rounded-2xl p-2.5 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00c950] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <img src="/assets/images/wsp_icon.png" alt="wsp icon" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <div style={{ color: "var(--adm-text-muted)" }} className="text-[11px] font-medium leading-none">
                WhatsApp
              </div>
              <a
                href={`https://wa.me/549${order.customerPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--adm-text-main)" }}
                className="text-sm font-bold hover:text-emerald-500 transition-colors block mt-0.5 leading-none"
              >
                {order.customerPhone}
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onCopyPhone(order.customerPhone || "", order.id)}
            title="Copiar número"
            style={{
              background: "var(--adm-surface)",
              borderColor: "var(--adm-border)",
              color: "var(--adm-text-muted)",
              borderRadius: "1.0rem",
            }}
            className="p-2 border hover:opacity-80 transition-opacity cursor-pointer"
          >
            {copiedOrderId === order.id ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* 7. Botonera de Acciones */}
      {!isApproved && !isRejected ? (
        isMP ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={updatingOrderId === order.id}
              onClick={() => onUpdateStatus(order.id, "aprobado")}
              className="w-full py-3 px-3 text-xs sm:text-sm font-black text-white bg-[#007a4d] hover:bg-[#006640] active:scale-[0.99] rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3] shrink-0" />
              <span>
                {updatingOrderId === order.id
                  ? "Guardando..."
                  : isPickup
                  ? "Aceptar para Retiro"
                  : "Aceptar (Delivery en camino)"}
              </span>
            </button>

            <button
              type="button"
              disabled={updatingOrderId === order.id}
              onClick={() => {
                if (confirm("¿Rechazar este pedido? El stock de los insumos será devuelto automáticamente al inventario.")) {
                  onUpdateStatus(order.id, "rechazado");
                }
              }}
              className="w-full py-3 px-3 text-xs sm:text-sm font-black text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.99] rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>Rechazar pedido</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={updatingOrderId === order.id}
              onClick={() => onUpdateStatus(order.id, "aprobado")}
              className="w-full py-3 px-5 text-sm font-black text-white bg-[#007a4d] hover:bg-[#006640] active:scale-[0.99] rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4.5 h-4.5 stroke-[3]" />
              <span>
                {updatingOrderId === order.id
                  ? "Guardando..."
                  : isPickup
                  ? "Aceptar Pedido (Listo para retirar)"
                  : "Aceptar Pedido (Delivery en camino)"}
              </span>
            </button>

            <button
              type="button"
              disabled={updatingOrderId === order.id}
              onClick={() => {
                if (confirm("¿Cancelar este pedido? El stock de los insumos será devuelto automáticamente al inventario.")) {
                  onUpdateStatus(order.id, "rechazado");
                }
              }}
              className="w-full text-center py-1.5 text-xs font-bold text-red-600 hover:text-red-700 flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Cancelar</span>
            </button>
          </div>
        )
      ) : isApproved ? (
        <div className="space-y-2">
          <div
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              color: "#10b981",
              borderColor: "rgba(16, 185, 129, 0.3)",
            }}
            className="w-full text-center py-2.5 text-xs font-bold rounded-2xl border flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              {isPickup
                ? "Pedido Aceptado — Listo para Retiro"
                : "Pedido Aceptado — Delivery en Camino al Cliente"}
            </span>
          </div>

          {!isPickup && order.customerPhone && (
            <a
              href={`https://wa.me/549${order.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                `🛵 ¡Hola ${order.customerName}! Tu pedido en Alakary (#${shortId}) fue aceptado y el delivery ya va en camino a tu dirección (${order.customerAddress || ""}). ¡Muchas gracias!`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors"
            >
              <span>🛵 Avisar al cliente por WhatsApp (Delivery en camino)</span>
            </a>
          )}
        </div>
      ) : (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.12)",
            color: "#ef4444",
            borderColor: "rgba(239, 68, 68, 0.3)",
          }}
          className="w-full text-center py-2.5 text-xs font-bold rounded-2xl border"
        >
          {isMP ? "Pedido Rechazado (Insumos reestablecidos)" : "Pedido Cancelado (Insumos reestablecidos)"}
        </div>
      )}
    </div>
  );
}
