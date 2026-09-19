"use client";

import React from "react";
import { Package } from "lucide-react";
import { InventoryItem } from "@/types/panel";

interface StockItemCardProps {
  item: InventoryItem;
  onQuickDelta: (id: string, delta: number) => void;
  onOpenAddLot: (item: InventoryItem) => void;
  onOpenPublish: (item: InventoryItem) => void;
}

export default function StockItemCard({
  item,
  onQuickDelta,
  onOpenAddLot,
  onOpenPublish,
}: StockItemCardProps) {
  const minThreshold = item.minAlert !== undefined ? item.minAlert : 15;
  const isOutOfStock = item.stock <= 0;
  const isLowStock = !isOutOfStock && item.stock < minThreshold;
  const statusClass = isOutOfStock ? "status-out" : isLowStock ? "status-low" : "";
  const badgeClass = isOutOfStock ? "out" : isLowStock ? "low" : "normal";
  const badgeLabel = isOutOfStock ? "Agotado" : isLowStock ? "Poco Stock" : "En Stock";

  return (
    <div className={`adm-card ${statusClass}`}>
      <div className="adm-card-top">
        <div className="adm-card-info-left">
          <div className="adm-card-icon">
            {item.icon ? (
              <span>{item.icon}</span>
            ) : (
              <Package className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div className="adm-card-details">
            <div className="adm-card-title">{item.name}</div>
            <div className="adm-card-cat">
              {item.category || "Insumo"}
              {item.source === "sheets" && (
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: "var(--adm-success)" }}>
                  <i className="fas fa-table"></i> Sheets
                </span>
              )}
              {item.barcode && (
                <span style={{ marginLeft: 6, fontFamily: "monospace", fontSize: 10, background: "var(--adm-surface-subtle)", padding: "1px 5px", borderRadius: 4 }}>
                  #{item.barcode}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={`adm-badge ${badgeClass}`}>{badgeLabel}</span>
      </div>

      <div className="adm-card-middle">
        <div className="adm-stock-display">
          <span className="adm-stock-num">{item.stock}</span>
          <span className="adm-stock-unit">{item.unit || "u."}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="adm-stepper-btn minus"
            disabled={item.stock <= 0}
            onClick={() => onQuickDelta(item.id, -1)}
            title="-1 unidad"
            style={item.stock <= 0 ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
          >
            −
          </button>
          <button
            type="button"
            className="adm-stepper-btn plus"
            onClick={() => onQuickDelta(item.id, 1)}
            title="+1 unidad"
          >
            +
          </button>
        </div>
      </div>

      <div className="adm-card-bottom-actions">
        <button
          type="button"
          className="adm-quick-btn"
          onClick={() => onQuickDelta(item.id, 5)}
          title="+5 unidades"
        >
          +5
        </button>
        <button
          type="button"
          className="adm-quick-btn"
          onClick={() => onOpenAddLot(item)}
        >
          <i className="fas fa-layer-group"></i> + Lote
        </button>
        <button
          type="button"
          className="adm-btn-sm-primary"
          onClick={() => onOpenPublish(item)}
        >
          <i className="fas fa-utensils"></i> Publicar
        </button>
      </div>
    </div>
  );
}
