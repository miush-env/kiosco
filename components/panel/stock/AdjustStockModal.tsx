"use client";

import React from "react";
import { InventoryItem } from "@/types/panel";

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: InventoryItem | null;
  onSubmit: (e: React.FormEvent) => void;
  lotQty: string;
  setLotQty: (v: string) => void;
  lotExpDate: string;
  setLotExpDate: (v: string) => void;
  lotCost: string;
  setLotCost: (v: string) => void;
}

export default function AdjustStockModal({
  isOpen,
  onClose,
  selectedItem,
  onSubmit,
  lotQty,
  setLotQty,
  lotExpDate,
  setLotExpDate,
  lotCost,
  setLotCost,
}: AdjustStockModalProps) {
  if (!isOpen || !selectedItem) return null;

  return (
    <div className="b1-modal-backdrop" onClick={onClose}>
      <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="adm-modal-header">
          <span className="adm-modal-title">Lote: {selectedItem.name}</span>
          <button type="button" className="adm-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="adm-modal-body">
            <div className="adm-form-group">
              <label className="adm-form-label">Cantidad *</label>
              <input
                type="number"
                min="1"
                className="adm-input"
                required
                value={lotQty}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setLotQty(e.target.value)}
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-form-label">Vencimiento</label>
              <input
                type="date"
                className="adm-input"
                value={lotExpDate}
                onChange={(e) => setLotExpDate(e.target.value)}
              />
            </div>

            <div className="adm-form-group" style={{ marginBottom: 0 }}>
              <label className="adm-form-label">Costo ($)</label>
              <input
                type="number"
                step="any"
                placeholder="0"
                className="adm-input"
                value={lotCost}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setLotCost(e.target.value)}
              />
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="adm-btn-submit">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
