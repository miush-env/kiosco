"use client";

import React from "react";

interface ManualSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  amount: string;
  setAmount: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
  method: string;
  setMethod: (v: string) => void;
}

export default function ManualSaleModal({
  isOpen,
  onClose,
  onSubmit,
  amount,
  setAmount,
  desc,
  setDesc,
  method,
  setMethod,
}: ManualSaleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="b1-modal-backdrop" onClick={onClose}>
      <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="adm-modal-header">
          <span className="adm-modal-title">Registrar Venta</span>
          <button type="button" className="adm-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="adm-modal-body">
            <div className="adm-form-group">
              <label className="adm-form-label">Monto ($) *</label>
              <input
                type="number"
                step="any"
                className="adm-input"
                style={{ fontWeight: 800, fontSize: 16, color: "var(--adm-success)" }}
                required
                placeholder="2500"
                value={amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-form-label">Descripción</label>
              <input
                type="text"
                className="adm-input"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            <div className="adm-form-group" style={{ marginBottom: 0 }}>
              <label className="adm-form-label">Medio de pago</label>
              <select
                className="adm-input"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="mercadopago">Mercado Pago / QR</option>
                <option value="debito">Tarjeta Débito</option>
                <option value="credito">Tarjeta Crédito</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="adm-btn-submit success">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
