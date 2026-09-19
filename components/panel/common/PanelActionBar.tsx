"use client";

import React from "react";
import { Volume2, VolumeX, RefreshCw, Trash2, Plus } from "lucide-react";
import { playNewOrderSound } from "@/lib/sound";

interface PanelActionBarProps {
  activeTab: "orders" | "stock" | "finance";
  pendingOrdersCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onRefreshOrders: () => void;
  onClearOrders: () => void;
  onOpenCreateItem: () => void;
}

export default function PanelActionBar({
  activeTab,
  pendingOrdersCount,
  soundEnabled,
  setSoundEnabled,
  onRefreshOrders,
  onClearOrders,
  onOpenCreateItem,
}: PanelActionBarProps) {
  if (activeTab === "finance") return null;

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 16,
      }}
    >
      {/* 1. Titulo y Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--b1-color-text-main)", margin: 0, letterSpacing: "-0.3px" }}>
          {activeTab === "orders" ? "Gestión de Pedidos" : "Control de Stock"}
        </h2>
        {activeTab === "orders" && pendingOrdersCount > 0 && (
          <span style={{ fontSize: 12, fontWeight: 800, background: "#FEE2E2", color: "#DC2626", padding: "3px 10px", borderRadius: 14 }}>
            {pendingOrdersCount} {pendingOrdersCount === 1 ? "pendiente" : "pendientes"}
          </span>
        )}
      </div>

      {/* 2. Botones de Acción Debajo */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", width: "100%" }}>
        {activeTab === "orders" && (
          <>
            {/* Sound & Alert notification button */}
            <button
              type="button"
              onClick={() => {
                if (!soundEnabled) {
                  playNewOrderSound();
                }
                if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
                  Notification.requestPermission();
                }
                setSoundEnabled(!soundEnabled);
              }}
              title={soundEnabled ? "Notificaciones de sonido activadas (Click para probar / desactivar)" : "Notificaciones de sonido desactivadas"}
              style={{
                background: soundEnabled ? "rgba(16, 185, 129, 0.15)" : "var(--adm-surface-subtle)",
                color: soundEnabled ? "var(--adm-success)" : "var(--adm-text-muted)",
                border: "1px solid " + (soundEnabled ? "rgba(16, 185, 129, 0.35)" : "var(--adm-border)"),
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13.5,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {soundEnabled ? (
                <Volume2 style={{ width: 16, height: 16, color: "var(--adm-success)" }} />
              ) : (
                <VolumeX style={{ width: 16, height: 16 }} />
              )}
              <span>{soundEnabled ? "Sonido ON" : "Sonido OFF"}</span>
            </button>

            <button
              type="button"
              onClick={onRefreshOrders}
              title="Recargar pedidos"
              style={{
                background: "var(--adm-surface-subtle)",
                color: "var(--adm-text-main)",
                border: "1px solid var(--adm-border)",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13.5,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <RefreshCw style={{ width: 15, height: 15 }} />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              onClick={onClearOrders}
              title="Limpiar pedidos"
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                color: "#EF4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13.5,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Trash2 style={{ width: 15, height: 15 }} />
              <span>Limpiar</span>
            </button>
          </>
        )}

        {activeTab === "stock" && (
          <button
            type="button"
            className="adm-btn-sm-primary"
            onClick={onOpenCreateItem}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", padding: "8px 14px", fontSize: 13.5, fontWeight: 800, whiteSpace: "nowrap" }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            <span>Nuevo Insumo</span>
          </button>
        )}
      </div>
    </section>
  );
}
