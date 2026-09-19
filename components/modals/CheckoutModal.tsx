"use client";

import React from "react";
import { CartItem } from "./CartModal";

interface FormErrors {
  name?: string;
  phone?: string;
  street?: string;
  streetNumber?: string;
  address?: string;
  cashAmount?: string;
}

interface StoreInfo {
  name: string;
  tagline?: string;
  address?: string;
  whatsapp?: string;
  currencySymbol?: string;
  deliveryPrice?: number;
  deliveryFree?: boolean;
}

interface CheckoutModalProps {
  isOpen: boolean;
  cart: CartItem[];
  cartItemCount: number;
  cartSubtotal: number;
  cartTotal: number;
  deliveryCost: number;
  deliveryType: "envio" | "retiro";
  paymentMethod: "efectivo" | "mercadopago";
  customerName: string;
  customerPhone: string;
  customerStreet: string;
  customerStreetNumber: string;
  customerAddressDetails: string;
  cashChangeOption: "exact" | "change";
  cashAmountGiven: string;
  pickupCode: string;
  formErrors: FormErrors;
  mpStep: "initial" | "opened";
  copiedMpLink: boolean;
  isSubmittingOrder: boolean;
  storeInfo: StoreInfo;
  estimatedDeliveryTime: string;
  estimatedPickupTime: string;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  phoneInputRef: React.RefObject<HTMLInputElement | null>;
  streetInputRef: React.RefObject<HTMLInputElement | null>;
  streetNumberInputRef: React.RefObject<HTMLInputElement | null>;
  cashAmountInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onDeliveryTypeChange: (type: "envio" | "retiro") => void;
  onPaymentMethodChange: (method: "efectivo" | "mercadopago") => void;
  onCustomerNameChange: (val: string) => void;
  onCustomerPhoneChange: (val: string) => void;
  onCustomerStreetChange: (val: string) => void;
  onCustomerStreetNumberChange: (val: string) => void;
  onCustomerAddressDetailsChange: (val: string) => void;
  onCashChangeOptionChange: (opt: "exact" | "change") => void;
  onCashAmountGivenChange: (val: string) => void;
  onCopyMpLink: () => void;
  onOpenMercadoPago: () => void;
  onFinalizeOrder: () => void;
}

function formatMoney(amount: number | string): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-AR");
}

export default function CheckoutModal({
  isOpen,
  cart,
  cartItemCount,
  cartSubtotal,
  cartTotal,
  deliveryCost,
  deliveryType,
  paymentMethod,
  customerName,
  customerPhone,
  customerStreet,
  customerStreetNumber,
  customerAddressDetails,
  cashChangeOption,
  cashAmountGiven,
  pickupCode,
  formErrors,
  mpStep,
  copiedMpLink,
  isSubmittingOrder,
  storeInfo,
  estimatedDeliveryTime,
  estimatedPickupTime,
  nameInputRef,
  phoneInputRef,
  streetInputRef,
  streetNumberInputRef,
  cashAmountInputRef,
  onClose,
  onDeliveryTypeChange,
  onPaymentMethodChange,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onCustomerStreetChange,
  onCustomerStreetNumberChange,
  onCustomerAddressDetailsChange,
  onCashChangeOptionChange,
  onCashAmountGivenChange,
  onCopyMpLink,
  onOpenMercadoPago,
  onFinalizeOrder,
}: CheckoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="b1-modal-backdrop" onClick={onClose}>
      <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", maxHeight: "92vh" }}>
        <div className="b1-sheet-drag-handle"></div>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--b1-color-border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fas fa-shopping-bag" style={{ color: "var(--b1-color-primary)", fontSize: 18 }}></i>
            <h5 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Finalizar Pedido</h5>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="b1-modal-close-btn"
            aria-label="Cerrar modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="b1-checkout-body">
          {/* Banner de Errores de Validación */}
          {Object.keys(formErrors).length > 0 && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1.5px solid #F87171",
                color: "#991B1B",
                borderRadius: "14px",
                padding: "10px 14px",
                fontSize: "12px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "14px",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.12)",
              }}
            >
              <i className="fas fa-exclamation-triangle" style={{ fontSize: 15, color: "#DC2626" }}></i>
              <span>Por favor revisá los campos marcados en rojo para continuar.</span>
            </div>
          )}

          {/* 1. Forma de entrega */}
          <div className="b1-form-group">
            <div className="b1-checkout-section-title">
              <i className="fas fa-truck"></i> 1. Forma de entrega
            </div>
            <div className="b1-choice-cards">
              <div
                className={`b1-choice-card ${deliveryType === "envio" ? "active" : ""}`}
                onClick={() => onDeliveryTypeChange("envio")}
              >
                <i className="fas fa-motorcycle" style={{ fontSize: 18, marginBottom: 4, display: "block" }}></i>
                <strong style={{ display: "block" }}>Envío a Domicilio</strong>
                <span style={{ fontSize: 11, color: storeInfo.deliveryPrice ? "var(--b1-color-text-muted)" : "var(--b1-color-success)", fontWeight: 700 }}>
                  {storeInfo.deliveryPrice ? `+$${formatMoney(storeInfo.deliveryPrice)}` : "¡Envío Gratis!"}
                </span>
              </div>
              <div
                className={`b1-choice-card ${deliveryType === "retiro" ? "active" : ""}`}
                onClick={() => onDeliveryTypeChange("retiro")}
              >
                <i className="fas fa-store" style={{ fontSize: 18, marginBottom: 4, display: "block" }}></i>
                <strong style={{ display: "block" }}>Retiro en Local</strong>
                <span style={{ fontSize: 11, color: "var(--b1-color-text-muted)" }}>En nuestro local</span>
              </div>
            </div>

            {deliveryType === "envio" ? (
              <div style={{ marginTop: 6, display: "flex", alignItems: "center" }}>
                <span className="b1-delivery-estimate-tag">
                  <i className="fas fa-clock"></i> Llega en {estimatedDeliveryTime} aprox.
                </span>
              </div>
            ) : (
              <div>
                <div className="b1-pickup-box" style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <i className="fas fa-map-marker-alt" style={{ color: "#3B82F6", fontSize: 18, marginTop: 2 }}></i>
                    <div>
                      <strong style={{ fontSize: 13, color: "var(--b1-color-text-main)", display: "block" }}>
                        Punto de retiro: {storeInfo.address || "Paderewski 3666, Valentín Alsina"}
                      </strong>
                      <span style={{ fontSize: 12, color: "var(--b1-color-text-muted)" }}>
                        🕒 Listo para retirar en <strong>{estimatedPickupTime} aprox.</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                    border: "1.5px dashed #059669",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#047857", letterSpacing: "0.5px", display: "block" }}>
                      🔑 Código de Retiro (4 dígitos)
                    </span>
                    <span style={{ fontSize: 12, color: "#065F46" }}>
                      Presentá este código al retirar en el local:
                    </span>
                  </div>
                  <div
                    style={{
                      background: "#059669",
                      color: "#fff",
                      fontWeight: 900,
                      fontSize: 18,
                      letterSpacing: 3,
                      padding: "5px 14px",
                      borderRadius: 10,
                      fontFamily: "monospace",
                      boxShadow: "0 2px 6px rgba(5,150,105,0.25)",
                    }}
                  >
                    #{pickupCode || "1234"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Datos del contacto */}
          <div className="b1-form-group">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div className="b1-checkout-section-title" style={{ margin: 0 }}>
                <i className="fas fa-user"></i> 2. Tus datos de contacto
              </div>
              {(customerName || customerPhone) && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--b1-color-success)",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "#ECFDF5",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    border: "1px solid #A7F3D0",
                  }}
                >
                  <i className="fas fa-check-circle" style={{ fontSize: 11 }}></i> ✓ Autocompletados
                </span>
              )}
            </div>

            <div style={{ marginBottom: 10 }}>
              <input
                ref={nameInputRef}
                type="text"
                className={`b1-input ${formErrors.name ? "b1-input-error" : ""}`}
                placeholder="Nombre completo *"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
              />
              {formErrors.name && (
                <span className="b1-field-error-msg">
                  <i className="fas fa-exclamation-circle"></i> {formErrors.name}
                </span>
              )}
            </div>

            <div style={{ marginBottom: 10 }}>
              <input
                ref={phoneInputRef}
                type="tel"
                className={`b1-input ${formErrors.phone ? "b1-input-error" : ""}`}
                placeholder="Teléfono / WhatsApp (ej: 11 2345-6789) *"
                value={customerPhone}
                onChange={(e) => onCustomerPhoneChange(e.target.value)}
              />
              {formErrors.phone && (
                <span className="b1-field-error-msg">
                  <i className="fas fa-exclamation-circle"></i> {formErrors.phone}
                </span>
              )}
            </div>
          </div>

          {/* 3. Dirección de entrega (Solo para Envíos) */}
          {deliveryType === "envio" && (
            <div className="b1-form-group">
              <div className="b1-checkout-section-title">
                <i className="fas fa-map-marker-alt"></i> 3. Dirección de entrega
              </div>
              <div className="b1-checkout-card" style={{ padding: "14px" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ flex: 2.3 }}>
                    <input
                      ref={streetInputRef}
                      type="text"
                      className={`b1-input ${formErrors.street ? "b1-input-error" : ""}`}
                      placeholder="Calle (ej: Paderewski) *"
                      style={{ background: "var(--b1-color-surface)" }}
                      value={customerStreet}
                      onChange={(e) => onCustomerStreetChange(e.target.value)}
                    />
                    {formErrors.street && (
                      <span className="b1-field-error-msg">
                        <i className="fas fa-exclamation-circle"></i> {formErrors.street}
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1.2 }}>
                    <input
                      ref={streetNumberInputRef}
                      type="text"
                      className={`b1-input ${formErrors.streetNumber ? "b1-input-error" : ""}`}
                      placeholder="Altura / N° *"
                      style={{ background: "var(--b1-color-surface)" }}
                      value={customerStreetNumber}
                      onChange={(e) => onCustomerStreetNumberChange(e.target.value)}
                    />
                    {formErrors.streetNumber && (
                      <span className="b1-field-error-msg">
                        <i className="fas fa-exclamation-circle"></i> {formErrors.streetNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    className="b1-input"
                    placeholder="Piso / Depto / Indicaciones de timbre (Opcional)"
                    style={{ background: "var(--b1-color-surface)", fontSize: "12px" }}
                    value={customerAddressDetails}
                    onChange={(e) => onCustomerAddressDetailsChange(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--b1-color-success)", fontWeight: 700, marginTop: 8 }}>
                  <i className="fas fa-check-circle"></i>
                  <span>✓ Dirección dentro de zona de entrega habitual</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Medio de pago (Solo para Envíos) */}
          {deliveryType === "envio" && (
            <div className="b1-form-group">
              <div className="b1-checkout-section-title">
                <i className="fas fa-money-bill-wave"></i> 4. Medio de pago
              </div>
              <div className="b1-payment-chips">
                {/* Deshabilitado temporalmente: Mercado Pago (código preservado para reactivación futura)
                <div
                  className={`b1-payment-chip ${paymentMethod === "mercadopago" ? "active" : ""}`}
                  onClick={() => onPaymentMethodChange("mercadopago")}
                >
                  💳 Mercado Pago
                </div>
                */}
                <div
                  className="b1-payment-chip active"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "11px 16px",
                    fontSize: "14px",
                    fontWeight: 800,
                    cursor: "default",
                    width: "100%",
                  }}
                >
                  <span style={{ fontSize: "17px" }}>💵</span>
                  <span>Efectivo (Pago al recibir)</span>
                </div>
              </div>

              {/* Lógica y vistas de Mercado Pago preservadas (ocultas temporalmente) */}
              {false && paymentMethod === "mercadopago" && (
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(0, 158, 227, 0.08) 0%, rgba(0, 158, 227, 0.02) 100%)",
                    border: "1.5px solid rgba(0, 158, 227, 0.35)",
                    borderRadius: "16px",
                    padding: "16px",
                    marginTop: 10,
                  }}
                >
                  <div
                    style={{
                      background: "#009EE3",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                      boxShadow: "0 4px 14px rgba(0, 158, 227, 0.28)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.95, display: "block" }}>
                        Monto total a transferir
                      </span>
                      <strong style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                        ${formatMoney(cartTotal)}
                      </strong>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 11, opacity: 0.95, lineHeight: 1.3 }}>
                      <span>Platos: <strong>${formatMoney(cartSubtotal)}</strong></span>
                      <br />
                      <span>Envío: <strong>${formatMoney(deliveryCost)}</strong></span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      background: "var(--b1-color-surface)",
                      border: "1px solid var(--b1-color-border-light)",
                      borderRadius: "12px",
                      padding: "10px 12px",
                      marginBottom: 10,
                      width: "100%",
                      boxSizing: "border-box",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                      <span style={{ color: "var(--b1-color-text-muted)", fontSize: 11, display: "block", marginBottom: 2 }}>
                        Pasarela oficial segura:
                      </span>
                      <div
                        style={{
                          fontFamily: "inherit",
                          color: "#007BB0",
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          lineHeight: 1.3,
                        }}
                      >
                        Mercado Pago Checkout Oficial (Débito, Crédito, Saldo)
                      </div>
                    </div>
                    <span
                      style={{
                        background: "rgba(0, 158, 227, 0.12)",
                        color: "#007BB0",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      100% Seguro
                    </span>
                  </div>

                  <div
                    style={{
                      background: "rgba(0, 158, 227, 0.08)",
                      border: "1px solid rgba(0, 158, 227, 0.3)",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      fontSize: 12,
                      color: "#007BB0",
                      lineHeight: 1.45,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <i className="fas fa-shield-alt" style={{ fontSize: 16, marginTop: 2, color: "#009EE3" }}></i>
                    <div>
                      <strong>Pago 100% Automático y Seguro:</strong> Al tocar <strong>"Pagar con Mercado Pago"</strong> serás redirigido para abonar el monto exacto. Tu pedido y acreditación se confirmarán automáticamente mediante notificación instantánea.
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "efectivo" && (
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1.5px dashed rgba(16, 185, 129, 0.4)",
                      borderRadius: "var(--b1-radius-md)",
                      padding: "10px 14px",
                      fontSize: 12,
                      color: "#065F46",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <i className="fas fa-hand-holding-usd" style={{ fontSize: 15 }}></i>
                    <span>Abonás en efectivo cuando recibís el pedido en tu domicilio.</span>
                  </div>

                  <div className="b1-checkout-card" style={{ padding: "12px 14px", margin: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8, color: "var(--b1-color-text-main)" }}>
                      ¿Necesitás vuelto?
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: cashChangeOption === "change" ? 10 : 0 }}>
                      <button
                        type="button"
                        className={`b1-vuelto-btn ${cashChangeOption === "exact" ? "active" : ""}`}
                        onClick={() => onCashChangeOptionChange("exact")}
                      >
                        Pago Justo (Sin vuelto)
                      </button>
                      <button
                        type="button"
                        className={`b1-vuelto-btn ${cashChangeOption === "change" ? "active" : ""}`}
                        onClick={() => onCashChangeOptionChange("change")}
                      >
                        ¿Con cuánto vas a pagar?
                      </button>
                    </div>

                    {cashChangeOption === "change" && (
                      <div>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 12, top: 11, fontWeight: 800, color: "var(--b1-color-text-muted)" }}>$</span>
                          <input
                            ref={cashAmountInputRef}
                            type="number"
                            inputMode="numeric"
                            className={`b1-input ${formErrors.cashAmount ? "b1-input-error" : ""}`}
                            placeholder={`Monto (ej: ${formatMoney(Math.ceil(cartTotal / 1000) * 1000 + 2000)})`}
                            style={{ paddingLeft: 26, background: "var(--b1-color-surface)" }}
                            value={cashAmountGiven}
                            onChange={(e) => onCashAmountGivenChange(e.target.value)}
                          />
                        </div>

                        {formErrors.cashAmount && (
                          <span className="b1-field-error-msg">
                            <i className="fas fa-exclamation-circle"></i> {formErrors.cashAmount}
                          </span>
                        )}

                        {parseFloat(cashAmountGiven) >= cartTotal && (
                          <div
                            style={{
                              marginTop: 8,
                              background: "#ECFDF5",
                              border: "1px solid #10B981",
                              color: "#065F46",
                              padding: "8px 12px",
                              borderRadius: 10,
                              fontSize: 12,
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <i className="fas fa-money-bill-wave"></i>
                            <span>Tu vuelto será: ${formatMoney(parseFloat(cashAmountGiven) - cartTotal)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Resumen de Platos */}
          <div className="b1-checkout-card" style={{ marginBottom: 14 }}>
            <div className="b1-checkout-section-title">
              <i className="fas fa-receipt"></i> Tu Pedido ({cartItemCount} {cartItemCount === 1 ? "plato" : "platos"})
            </div>
            <div className="b1-order-items-list">
              {cart.map((item) => (
                <div key={item.cartId} className="b1-order-item-row">
                  <div style={{ flex: 1, paddingRight: 8 }}>
                    <span className="b1-order-item-qty">{item.quantity}×</span>
                    <span className="b1-order-item-name">{item.name}</span>
                    {item.comment && (
                      <span className="b1-order-item-note">
                        <i className="fas fa-comment-dots" style={{ marginRight: 3 }}></i>
                        {item.comment}
                      </span>
                    )}
                  </div>
                  <span className="b1-order-item-price">${formatMoney(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Desglose de Totales */}
          <div className="b1-summary-box">
            <div className="b1-summary-row">
              <span>Subtotal pedido:</span>
              <strong>${formatMoney(cartSubtotal)}</strong>
            </div>
            <div className="b1-summary-row">
              <span>Entrega:</span>
              <strong style={{ color: "var(--b1-color-success)" }}>
                {deliveryType === "retiro"
                  ? "Retiro en local (Gratis)"
                  : deliveryCost === 0
                  ? "Envío Gratis"
                  : `$${formatMoney(deliveryCost)}`}
              </strong>
            </div>
            <div className="b1-summary-row total">
              <span style={{ fontSize: 15, fontWeight: 700 }}>Total a pagar:</span>
              <strong style={{ color: "var(--b1-color-primary)", fontSize: 24, fontWeight: 900 }}>
                ${formatMoney(cartTotal)}
              </strong>
            </div>
          </div>
        </div>

        {/* Botón de Enviar Pedido */}
        <div className="b1-checkout-sticky-footer">
          {deliveryType === "retiro" ? (
            <button
              type="button"
              className="b1-btn-primary"
              disabled={isSubmittingOrder}
              onClick={onFinalizeOrder}
              style={{ padding: "14px 18px", fontSize: 15, fontWeight: 800 }}
            >
              <span>
                <i className="fab fa-whatsapp" style={{ fontSize: 18, marginRight: 6 }}></i>
                {isSubmittingOrder ? "Confirmando pedido..." : "Confirmar Pedido para Retirar"}
              </span>
              <span style={{ fontWeight: 900, fontSize: 17 }}>${formatMoney(cartTotal)}</span>
            </button>
          ) : /* Deshabilitado temporalmente: Mercado Pago (código preservado) */ false && paymentMethod === "mercadopago" ? (
            <button
              type="button"
              className="b1-btn-primary"
              disabled={isSubmittingOrder}
              onClick={onOpenMercadoPago}
              style={{
                padding: "14px 18px",
                fontSize: 15,
                fontWeight: 800,
                background: "#009EE3",
                boxShadow: "0 4px 14px rgba(0, 158, 227, 0.35)",
              }}
            >
              <span>
                {isSubmittingOrder ? (
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: 16, marginRight: 6 }}></i>
                ) : (
                  <i className="fas fa-credit-card" style={{ fontSize: 16, marginRight: 6 }}></i>
                )}
                {isSubmittingOrder ? "Conectando con Mercado Pago..." : "Pagar con Mercado Pago"}
              </span>
              <span style={{ fontWeight: 900, fontSize: 17 }}>${formatMoney(cartTotal)}</span>
            </button>
          ) : (
            <button
              type="button"
              className="b1-btn-primary"
              disabled={isSubmittingOrder}
              onClick={onFinalizeOrder}
              style={{
                padding: "14px 18px",
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              <span>
                <i className="fab fa-whatsapp" style={{ fontSize: 18, marginRight: 6 }}></i>
                {isSubmittingOrder ? "Redirigiendo a WhatsApp..." : "Enviar Pedido por WhatsApp"}
              </span>
              <span style={{ fontWeight: 900, fontSize: 17 }}>${formatMoney(cartTotal)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
