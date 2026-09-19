"use client";

import React from "react";
import { Bell, Clock, CheckCircle2, Ban } from "lucide-react";
import { Order, OrderFilter } from "@/types/panel";
import OrderFilters from "./OrderFilters";
import OrderCard from "./OrderCard";
import OrderReceiptModal from "./OrderReceiptModal";

interface OrdersTabProps {
  orders: Order[];
  filteredOrders: Order[];
  orderFilter: OrderFilter;
  setOrderFilter: (filter: OrderFilter) => void;
  orderStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  updatingOrderId: string | null;
  copiedOrderId: string | null;
  selectedReceiptImage: string | null;
  setSelectedReceiptImage: (img: string | null) => void;
  notificationPermission: string;
  onRequestNotificationPermission: () => void;
  onUpdateStatus: (orderId: string, status: "aprobado" | "rechazado") => void;
  onCopyPhone: (phone: string, orderId: string) => void;
  onShareWhatsApp: (order: Order) => void;
}

export default function OrdersTab({
  filteredOrders,
  orderFilter,
  setOrderFilter,
  orderStats,
  updatingOrderId,
  copiedOrderId,
  selectedReceiptImage,
  setSelectedReceiptImage,
  notificationPermission,
  onRequestNotificationPermission,
  onUpdateStatus,
  onCopyPhone,
  onShareWhatsApp,
}: OrdersTabProps) {
  return (
    <div style={{ paddingTop: 8, paddingBottom: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Notification Permission Banner */}
      {notificationPermission !== "granted" && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: 16,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "#f59e0b",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Bell className="animate-bounce" style={{ width: 20, height: 20 }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "var(--adm-text-main)", fontWeight: 900, fontSize: 13, textWrap: "balance" }}>
                Activar Notificaciones del Sistema (Sonido y Alertas)
              </div>
              <div style={{ color: "var(--adm-text-muted)", fontSize: 12, fontWeight: 500, marginTop: 2, textWrap: "balance" }}>
                Permite que tu PC o celular te avise con sonido cuando entre un pedido, incluso si minimizas Chrome o estás usando otra app.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onRequestNotificationPermission}
            style={{
              padding: "8px 16px",
              background: "#047857",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 900,
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Activar Notificaciones
          </button>
        </div>
      )}

      {/* Segmented Filter Buttons */}
      <OrderFilters
        orderFilter={orderFilter}
        setOrderFilter={setOrderFilter}
        orderStats={orderStats}
      />

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <div
          style={{
            background: "var(--adm-surface)",
            border: "1px solid var(--adm-border)",
            borderRadius: 20,
            padding: "54px 20px 60px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          {/* Icon Badge */}
          <div
            style={{
              background: "var(--adm-surface-subtle)",
              border: "1px solid var(--adm-border)",
              width: 72,
              height: 72,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              flexShrink: 0,
            }}
          >
            {orderFilter === "pendiente" ? (
              <Clock style={{ width: 36, height: 36, color: "#f59e0b" }} strokeWidth={2.2} />
            ) : orderFilter === "aprobado" ? (
              <CheckCircle2 style={{ width: 36, height: 36, color: "#10b981" }} strokeWidth={2.2} />
            ) : orderFilter === "rechazado" ? (
              <Ban style={{ width: 36, height: 36, color: "#ef4444" }} strokeWidth={2.2} />
            ) : (
              <Bell style={{ width: 36, height: 36, color: "var(--adm-text-muted)" }} strokeWidth={2.2} />
            )}
          </div>

          {/* Title */}
          <h3
            style={{
              color: "var(--adm-text-main)",
              fontWeight: 900,
              fontSize: 17,
              lineHeight: 1.3,
              margin: "0 0 10px 0",
              maxWidth: 440,
              letterSpacing: "-0.2px",
              textWrap: "balance",
            }}
          >
            {orderFilter === "pendiente"
              ? "No hay pedidos pendientes de cobro"
              : orderFilter === "aprobado"
                ? "No hay pedidos cobrados aún"
                : orderFilter === "rechazado"
                  ? "No hay pedidos cancelados"
                  : "No hay pedidos en esta sección"}
          </h3>

          {/* Subtitle / Texto Inferior */}
          <p
            style={{
              color: "var(--adm-text-muted)",
              fontSize: 13.5,
              fontWeight: 500,
              lineHeight: 1.55,
              margin: 0,
              padding: "0 12px",
              maxWidth: 420,
              textWrap: "balance",
            }}
          >
            {orderFilter === "pendiente"
              ? "Todos los pedidos pendientes (efectivo o transferencia) se encuentran al día."
              : orderFilter === "aprobado"
                ? "Los pedidos cobrados y entregados aparecerán listados acá."
                : orderFilter === "rechazado"
                  ? "Los pedidos que sean cancelados aparecerán acá."
                  : "Los nuevos pedidos en efectivo y por Mercado Pago aparecerán acá en tiempo real."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              updatingOrderId={updatingOrderId}
              copiedOrderId={copiedOrderId}
              onUpdateStatus={onUpdateStatus}
              onCopyPhone={onCopyPhone}
              onViewReceipt={(img) => setSelectedReceiptImage(img)}
              onShareWhatsApp={onShareWhatsApp}
            />
          ))}
        </div>
      )}

      {/* Receipt Image Modal */}
      <OrderReceiptModal
        receiptImage={selectedReceiptImage}
        onClose={() => setSelectedReceiptImage(null)}
      />
    </div>
  );
}
