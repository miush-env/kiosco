"use client";

import React from "react";

interface ManualExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  amount: string;
  setAmount: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
}

export default function ManualExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  amount,
  setAmount,
  desc,
  setDesc,
  category,
  setCategory,
}: ManualExpenseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="b1-modal-backdrop" onClick={onClose}>
      <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="adm-modal-header">
          <span className="adm-modal-title">Registrar Gasto</span>
          <button type="button" className="adm-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="adm-modal-body">
            <div className="adm-form-group">
              <label className="adm-form-label">Descripción *</label>
              <input
                type="text"
                placeholder="Ej: Bolsas, flete..."
                className="adm-input"
                required
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-form-label">Monto ($) *</label>
              <input
                type="number"
                step="any"
                className="adm-input"
                style={{ fontWeight: 800, fontSize: 16, color: "var(--adm-danger)" }}
                required
                placeholder="4500"
                value={amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="adm-form-group" style={{ marginBottom: 0 }}>
              <label className="adm-form-label">Categoría</label>
              <select
                className="adm-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="general">Gastos Generales</option>
                <option value="stock">Insumos</option>
                <option value="servicios">Servicios</option>
                <option value="sueldos">Sueldos</option>
              </select>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="adm-btn-submit danger">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
