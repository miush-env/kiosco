"use client";

import React from "react";
import { Product } from "../home/ProductCard";

interface CartItem {
  id: number;
  quantity: number;
}

interface ProductDetailModalProps {
  product: Product | null;
  products: Product[];
  cart: CartItem[];
  quantity: number;
  comment: string;
  onClose: () => void;
  onQuantityChange: (qty: number) => void;
  onCommentChange: (comment: string) => void;
  onAddToCart: () => void;
}

function formatMoney(amount: number | string): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-AR");
}

export default function ProductDetailModal({
  product,
  products,
  cart,
  quantity,
  comment,
  onClose,
  onQuantityChange,
  onCommentChange,
  onAddToCart,
}: ProductDetailModalProps) {
  if (!product) return null;

  const latestProd = products.find((p) => Number(p.id) === Number(product.id)) || product;
  const inCartCount = cart.filter((i) => Number(i.id) === Number(latestProd.id)).reduce((s, i) => s + i.quantity, 0);
  const maxStock = latestProd.availableStock;
  const remainingStock = maxStock !== undefined ? Math.max(0, maxStock - inCartCount) : 999;
  const isSoldOut = maxStock !== undefined && maxStock <= 0;
  const isCappedInCart = maxStock !== undefined && remainingStock <= 0 && !isSoldOut;

  const rawIng = product.ingredients;
  const ingList: string[] = Array.isArray(rawIng)
    ? rawIng.flatMap((item) => String(item).split(/[,•\n]+/)).map((s) => s.trim()).filter(Boolean)
    : typeof rawIng === "string"
    ? (rawIng as string).split(/[,•\n]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  const isEmpanada =
    latestProd.categoryId === "empanadas" ||
    latestProd.name.toLowerCase().includes("empanada");
  const step = isEmpanada ? 6 : 1;
  const minUnits = isEmpanada ? 6 : 1;

  const calculateTotal = () => {
    if (isSoldOut || isCappedInCart) return 0;
    if (isEmpanada) {
      if (quantity === 6) return 10000;
      if (quantity === 12) return 18000;
      if (quantity === 18) return 28000;
      if (quantity % 12 === 0) return 18000 * (quantity / 12);
      const numDocenas = Math.floor(quantity / 12);
      return numDocenas * 18000 + 10000;
    }
    return latestProd.price * quantity;
  };

  const getEmpanadaLabel = (q: number) => {
    if (q === 6) return "Media docena (6 unidades)";
    if (q === 12) return "1 docena (12 unidades)";
    if (q === 18) return "1 docena y media (18 unidades)";
    if (q === 24) return "2 docenas (24 unidades)";
    if (q % 12 === 0) return `${q / 12} docenas (${q} unidades)`;
    return `${Math.floor(q / 12)} docenas y media (${q} unidades)`;
  };

  return (
    <div className="b1-modal-backdrop" onClick={onClose}>
      <div
        className="b1-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: "26px 26px 0 0" }}
      >
        {/* Imagen de Cabecera */}
        <div className="b1-detail-hero-wrapper" style={{ position: "relative", width: "100%", height: 210, overflow: "hidden", borderRadius: "26px 26px 0 0" }}>
          <img
            src={product.image || "/assets/images/logo.png"}
            alt={product.name}
            className="b1-detail-hero-img"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600";
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "65%",
              background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
          <div className="b1-detail-nav-top" style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", zIndex: 10 }}>
            <button
              type="button"
              className="b1-detail-circle-btn"
              onClick={onClose}
              aria-label="Volver"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <button
              type="button"
              className="b1-detail-circle-btn"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Cuerpo del Detalle */}
        <div className="b1-detail-body" style={{ overflowY: "auto", flex: 1, padding: "20px 22px" }}>
          <h2 className="b1-detail-title" style={{ fontSize: "24px", fontWeight: 900, color: "var(--b1-color-text-main)", lineHeight: 1.25, margin: "0 0 6px", letterSpacing: "-0.4px" }}>
            {product.name}
          </h2>
          <div className="b1-detail-price" style={{ fontSize: "24px", fontWeight: 900, color: "var(--b1-color-primary)", marginBottom: isEmpanada ? "8px" : "12px", letterSpacing: "-0.3px", display: "flex", alignItems: "baseline", gap: 8 }}>
            <span>${formatMoney(product.price)}</span>
            {isEmpanada && (
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--b1-color-text-muted)" }}>
                (Media docena - 6u)
              </span>
            )}
          </div>

          {/* Banner de Oferta por Docena para Empanadas */}
          {isEmpanada && (
            <div
              style={{
                background: "#FFF7ED",
                border: "1.5px solid #FED7AA",
                borderRadius: 14,
                padding: "10px 14px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: "14.5px", fontWeight: 900, color: "#9A3412" }}>
                  ¡Promo Docena: $18.000!
                </div>
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#C2410C", marginTop: 1 }}>
                  Ahorrás $2.000 llevando 1 docena o más (6u a $10.000).
                </div>
              </div>
              <span
                style={{
                  background: "#EA580C",
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: 900,
                  padding: "4px 8px",
                  borderRadius: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  flexShrink: 0,
                }}
              >
                Oferta
              </span>
            </div>
          )}

          <p className="b1-detail-desc" style={{ fontSize: "16px", lineHeight: "1.6", fontWeight: 500, color: "var(--b1-color-text-main)", marginBottom: "18px" }}>
            {product.description}
          </p>

          {/* Avisos de Stock */}
          {isSoldOut && (
            <div className="b1-out-of-stock-banner" style={{ background: "#FEE2E2", borderColor: "#FECACA", color: "#991B1B", marginBottom: 16, fontSize: "14px", fontWeight: 700, padding: "12px 16px" }}>
              <i className="fas fa-ban" style={{ color: "#DC2626", fontSize: "18px" }}></i>
              <span>Agotado: no hay stock suficiente en cocina.</span>
            </div>
          )}

          {isCappedInCart && (
            <div className="b1-out-of-stock-banner" style={{ background: "#FEF3C7", borderColor: "#FDE68A", color: "#92400E", marginBottom: 16, fontSize: "14px", fontWeight: 700, padding: "12px 16px" }}>
              <i className="fas fa-shopping-basket" style={{ color: "#D97706", fontSize: "18px" }}></i>
              <span>Ya tenés en tu carrito las {maxStock} porciones disponibles de este plato.</span>
            </div>
          )}

          {!isSoldOut && !isCappedInCart && maxStock !== undefined && maxStock <= 5 && (
            <div className="b1-out-of-stock-banner" style={{ background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E", marginBottom: 16, fontSize: "14px", fontWeight: 700, padding: "12px 16px" }}>
              <i className="fas fa-exclamation-triangle" style={{ color: "#B45309", fontSize: "18px" }}></i>
              <span>¡Quedan solo {remainingStock} disponibles para agregar!</span>
            </div>
          )}

          {/* Ingredientes */}
          {ingList.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div className="b1-ingredients-title" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--b1-color-text-muted)", marginBottom: 10 }}>
                <i className="fas fa-utensils" style={{ color: "var(--b1-color-primary)", fontSize: "14px" }}></i>
                <span>Ingredientes incluidos</span>
              </div>
              <div className="b1-ingredients-list" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ingList.map((ing, i) => (
                  <span
                    key={i}
                    className="b1-ingredient-chip"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 14px",
                      borderRadius: 22,
                      fontSize: "14.5px",
                      fontWeight: 700,
                      background: "var(--b1-color-surface-subtle)",
                      color: "var(--b1-color-text-main)",
                      border: "1.5px solid var(--b1-color-border)",
                    }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Selector de Presentación Rápido para Empanadas */}
          {isEmpanada && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: "13.5px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "var(--b1-color-text-muted)",
                  marginBottom: 8,
                  letterSpacing: "0.4px",
                }}
              >
                Elegí tu presentación
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {[
                  { q: 6, label: "Media Docena (6u)", price: "$10.000", badge: undefined },
                  { q: 12, label: "1 Docena (12u)", price: "$18.000", badge: "¡Oferta!" },
                  { q: 18, label: "Docena y Media (18u)", price: "$28.000", badge: undefined },
                  { q: 24, label: "2 Docenas (24u)", price: "$36.000", badge: "¡Oferta!" },
                ].map((pack) => {
                  const isSelected = quantity === pack.q;
                  return (
                    <button
                      key={pack.q}
                      type="button"
                      onClick={() => onQuantityChange(pack.q)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: isSelected ? "2px solid #EA580C" : "1.5px solid var(--b1-color-border)",
                        background: isSelected ? "#FFF7ED" : "var(--b1-color-surface)",
                        color: isSelected ? "#9A3412" : "var(--b1-color-text-main)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        position: "relative",
                        textAlign: "left",
                        boxShadow: isSelected ? "0 2px 8px rgba(234, 88, 12, 0.15)" : "none",
                      }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: 800, lineHeight: 1.2 }}>{pack.label}</span>
                      <span style={{ fontSize: "14.5px", fontWeight: 900, color: "#EA580C", marginTop: 4 }}>
                        {pack.price}
                      </span>
                      {pack.badge && (
                        <span
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            background: "#DC2626",
                            color: "#FFFFFF",
                            fontSize: "10px",
                            fontWeight: 900,
                            padding: "2px 6px",
                            borderRadius: 6,
                            textTransform: "uppercase",
                          }}
                        >
                          {pack.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Control de Cantidad */}
          <div
            style={{
              background: "var(--b1-color-surface-subtle)",
              borderRadius: "var(--b1-radius-lg)",
              padding: "14px 18px",
              marginBottom: 16,
              opacity: isSoldOut || isCappedInCart ? 0.6 : 1,
              border: "1px solid var(--b1-color-border-light)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "var(--b1-color-text-main)",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    display: "block",
                  }}
                >
                  {isEmpanada ? "Cantidad de empanadas" : "Cantidad de porciones"}
                </span>
                {isEmpanada && (
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#EA580C",
                      marginTop: 2,
                      display: "block",
                    }}
                  >
                    {getEmpanadaLabel(quantity)}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button
                  type="button"
                  className="b1-step-btn minus"
                  disabled={quantity <= minUnits || isSoldOut || isCappedInCart}
                  onClick={() => onQuantityChange(Math.max(minUnits, quantity - step))}
                  style={{ width: 42, height: 42, fontSize: 16 }}
                >
                  <i className="fas fa-minus"></i>
                </button>
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    minWidth: 36,
                    textAlign: "center",
                    color: "var(--b1-color-text-main)",
                  }}
                >
                  {isSoldOut || isCappedInCart ? 0 : quantity}
                </span>
                <button
                  type="button"
                  className="b1-step-btn plus"
                  disabled={isSoldOut || isCappedInCart || quantity >= remainingStock}
                  onClick={() => onQuantityChange(Math.min(quantity + step, remainingStock))}
                  style={{ width: 42, height: 42, fontSize: 16 }}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Indicaciones para cocina */}
          <div className="b1-form-group" style={{ marginBottom: 16 }}>
            <label className="b1-form-label" style={{ fontSize: "14.5px", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6, color: "var(--b1-color-text-main)" }}>
              <i className="far fa-edit" style={{ color: "var(--b1-color-primary)" }}></i>
              <span>Indicaciones para la cocina (opcional)</span>
            </label>
            <input
              type="text"
              className="b1-input"
              placeholder="Ej: bien cocida, sin orégano, aderezos aparte..."
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              disabled={isSoldOut || isCappedInCart}
              style={{ fontSize: "15px", padding: "12px 14px", borderRadius: "12px" }}
            />
          </div>
        </div>

        {/* Botón de Confirmación */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--b1-color-border-light)" }}>
          <button
            type="button"
            className="b1-btn-primary"
            disabled={isSoldOut || isCappedInCart}
            onClick={onAddToCart}
            style={{ padding: "16px 20px", fontSize: "17px", fontWeight: 800, borderRadius: "14px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className={`fas ${isSoldOut || isCappedInCart ? "fa-ban" : "fa-plus-circle"}`} style={{ fontSize: "18px" }}></i>
              <span>
                {isSoldOut
                  ? "Agotado por falta de stock"
                  : isCappedInCart
                  ? `Máximo en carrito (${maxStock})`
                  : "Agregar al pedido"}
              </span>
            </span>
            <span style={{ fontWeight: 900, fontSize: "18px" }}>
              ${formatMoney(calculateTotal())}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
