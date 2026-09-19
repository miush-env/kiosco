"use client";

import React from "react";

export interface CartItem {
  id: number;
  cartId: string;
  name: string;
  price: number;
  quantity: number;
  comment?: string;
  image?: string | null;
  linkedInventoryId?: string;
  availableStock?: number;
}

interface CartModalProps {
  isOpen: boolean;
  cart: CartItem[];
  cartTotal: number;
  deliveryType: "envio" | "retiro";
  onClose: () => void;
  onClearCart: () => void;
  onUpdateQty: (cartId: string, delta: number) => void;
  onContinueCheckout: () => void;
  onExploreMenu: () => void;
}

function formatMoney(amount: number | string): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-AR");
}

export default function CartModal({
  isOpen,
  cart,
  cartTotal,
  deliveryType,
  onClose,
  onClearCart,
  onUpdateQty,
  onContinueCheckout,
  onExploreMenu,
}: CartModalProps) {
  if (!isOpen) return null;

  return (
    <div className="b1-modal-backdrop" onClick={onClose}>
      <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="b1-sheet-drag-handle"></div>

        {/* Cabecera */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--b1-color-border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h5 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
            <i className="fas fa-shopping-basket" style={{ color: "var(--b1-color-primary)", marginRight: 6 }}></i>
            Mi Pedido
          </h5>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="b1-cart-clear-btn"
                style={{
                  background: "#FEE2E2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
                  fontSize: "12px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  padding: "5px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
                title="Vaciar todos los productos del carrito"
              >
                <i className="fas fa-trash-alt" style={{ color: "#DC2626", fontSize: "12px" }}></i>
                <span style={{ color: "#DC2626", fontWeight: 700 }}>Vaciar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="b1-modal-close-btn"
              aria-label="Cerrar carrito"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Lista de Items */}
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
          {cart.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "var(--b1-color-primary-light, #FFF7ED)",
                  border: "1px solid rgba(234, 88, 12, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  boxShadow: "0 4px 12px rgba(234, 88, 12, 0.12)",
                }}
              >
                <i className="fas fa-shopping-bag" style={{ fontSize: 26, color: "var(--b1-color-primary, #EA580C)" }}></i>
              </div>
              <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--b1-color-text-main)", margin: "0 0 6px", letterSpacing: "-0.2px" }}>
                Tu carrito está vacío
              </h4>
              <p style={{ fontSize: 13, color: "var(--b1-color-text-muted)", margin: "0 0 22px", maxWidth: 240, lineHeight: 1.45 }}>
                Agregá tus platos favoritos para empezar tu pedido.
              </p>
              <button
                type="button"
                onClick={onExploreMenu}
                className="b1-btn-primary"
                style={{
                  width: "100%",
                  maxWidth: 250,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(234, 88, 12, 0.25)",
                  cursor: "pointer",
                }}
              >
                <span>Explorar la carta</span>
                <i className="fas fa-arrow-right" style={{ fontSize: 12 }}></i>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cart.map((item) => (
                <div
                  key={item.cartId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "var(--b1-color-surface-subtle)",
                    borderRadius: "var(--b1-radius-md)",
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: 14, color: "var(--b1-color-text-main)", display: "block" }}>
                      {item.name}
                    </strong>
                    {item.comment && (
                      <span style={{ fontSize: 11, color: "var(--b1-color-text-muted)", fontStyle: "italic", display: "block" }}>
                        Nota: {item.comment}
                      </span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--b1-color-primary)" }}>
                      ${formatMoney(item.price * item.quantity)}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      className="b1-step-btn minus"
                      style={{ width: 28, height: 28, fontSize: 11 }}
                      onClick={() => onUpdateQty(item.cartId, -1)}
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 800, minWidth: 16, textAlign: "center", color: "var(--b1-color-text-main)" }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="b1-step-btn plus"
                      style={{ width: 28, height: 28, fontSize: 11 }}
                      disabled={item.availableStock !== undefined && item.quantity >= item.availableStock}
                      onClick={() => onUpdateQty(item.cartId, 1)}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total y Checkout */}
        {cart.length > 0 && (
          <div style={{ padding: "16px 18px", borderTop: "1px solid var(--b1-color-border-light)", background: "var(--b1-color-surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--b1-color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>
                  Total a pagar
                </span>
                <span style={{ fontSize: 12, color: "var(--b1-color-text-muted)" }}>
                  {deliveryType === "retiro" ? "Retiro en local ($0)" : "Envío a domicilio ($1.000)"}
                </span>
              </div>
              <strong style={{ fontSize: 26, fontWeight: 900, color: "var(--b1-color-primary)", letterSpacing: "-0.5px", lineHeight: 1 }}>
                ${formatMoney(cartTotal)}
              </strong>
            </div>

            <button
              type="button"
              className="b1-btn-primary"
              onClick={onContinueCheckout}
              style={{ width: "100%", padding: "14px 18px", fontSize: 15, fontWeight: 800 }}
            >
              <span>Continuar con mi pedido</span>
              <span>${formatMoney(cartTotal)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
