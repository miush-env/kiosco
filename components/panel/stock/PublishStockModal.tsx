"use client";

import React from "react";
import { InventoryItem } from "@/types/panel";

interface PublishStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  publishItem: InventoryItem | null;
  onSubmit: (e: React.FormEvent) => void;
  publishPrice: string;
  setPublishPrice: (v: string) => void;
}

export default function PublishStockModal({
  isOpen,
  onClose,
  publishItem,
  onSubmit,
  publishPrice,
  setPublishPrice,
}: PublishStockModalProps) {
  if (!isOpen || !publishItem) return null;

  return (
    <div className="b1-modal-backdrop" onClick={onClose}>
      <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="adm-modal-header">
          <span className="adm-modal-title">Publicar: {publishItem.name}</span>
          <button type="button" className="adm-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="adm-modal-body">
            <p style={{ color: "var(--adm-text-muted)", margin: "0 0 14px", fontSize: 13, lineHeight: 1.4 }}>
              Este insumo se agregará a la carta pública de clientes.
            </p>
            <div className="adm-form-group" style={{ marginBottom: 0 }}>
              <label className="adm-form-label">Precio de venta ($) *</label>
              <input
                type="number"
                step="any"
                placeholder="Ej: 2500"
                className="adm-input"
                style={{ fontSize: 16, fontWeight: 800, color: "var(--adm-primary)" }}
                required
                value={publishPrice}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setPublishPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="adm-btn-submit">Publicar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
