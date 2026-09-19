"use client";

import React from "react";

interface CreateEditStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  unit: string;
  setUnit: (v: string) => void;
  barcode: string;
  setBarcode: (v: string) => void;
  minAlert: string;
  setMinAlert: (v: string) => void;
  qty: string;
  setQty: (v: string) => void;
  cost: string;
  setCost: (v: string) => void;
}

export default function CreateEditStockModal({
  isOpen,
  onClose,
  onSubmit,
  name,
  setName,
  category,
  setCategory,
  unit,
  setUnit,
  barcode,
  setBarcode,
  minAlert,
  setMinAlert,
  qty,
  setQty,
  cost,
  setCost,
}: CreateEditStockModalProps) {
  if (!isOpen) return null;

  return (
    <div className="b1-modal-backdrop" onClick={onClose}>
      <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="adm-modal-header">
          <span className="adm-modal-title">Alta de Insumo de Stock</span>
          <button type="button" className="adm-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="adm-modal-body">
            <div className="adm-form-group">
              <label className="adm-form-label">Nombre *</label>
              <input
                type="text"
                placeholder="Ej: Carne Vacuna"
                className="adm-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="adm-form-group">
                <label className="adm-form-label">Categoría</label>
                <input
                  type="text"
                  placeholder="Carnes..."
                  className="adm-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">Unidad</label>
                <input
                  type="text"
                  placeholder="unidades, gr"
                  className="adm-input"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </div>

            <div className="adm-form-group">
              <label className="adm-form-label">Código de barras</label>
              <input
                type="text"
                placeholder="779..."
                className="adm-input"
                style={{ fontFamily: "monospace" }}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div className="adm-form-group">
                <label className="adm-form-label">Stock</label>
                <input
                  type="number"
                  className="adm-input"
                  value={qty}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">Mínimo</label>
                <input
                  type="number"
                  className="adm-input"
                  value={minAlert}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setMinAlert(e.target.value)}
                />
              </div>
              <div className="adm-form-group" style={{ marginBottom: 0 }}>
                <label className="adm-form-label">Costo</label>
                <input
                  type="number"
                  placeholder="0"
                  className="adm-input"
                  value={cost}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="adm-btn-submit">Crear</button>
          </div>
        </form>
      </div>
    </div>
  );
}
