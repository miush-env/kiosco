"use client";

import React from "react";
import { Check, X, Copy, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

interface MercadoPagoReturnModalProps {
  isOpen: boolean;
  status: "success" | "pending" | "failure";
  order: any | null;
  copied: boolean;
  onClose: () => void;
  onRetry: () => void;
  onCopy: () => void;
  formatMoney: (amount: number | string) => string;
  getMPWhatsAppUrl: (order: any) => string;
}

export function MercadoPagoReturnModal({
  isOpen,
  status,
  order,
  copied,
  onClose,
  onRetry,
  onCopy,
  formatMoney,
  getMPWhatsAppUrl,
}: MercadoPagoReturnModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="b1-modal-backdrop"
      style={{
        zIndex: 99999,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        className="b1-modal-card"
        style={{
          maxWidth: 440,
          padding: 0,
          overflow: "hidden",
          borderRadius: 20,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          backgroundColor: "#ffffff",
          background: "#ffffff",
          border: "1px solid #E2E8F0",
        }}
      >
        {/* Header banner */}
        <div
          style={{
            background:
              status === "failure"
                ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            color: "#ffffff",
            padding: "26px 20px 22px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              fontSize: 30,
              backdropFilter: "blur(4px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {status === "failure" ? (
              <X style={{ width: 32, height: 32, color: "#fff", strokeWidth: 3 }} />
            ) : (
              <Check style={{ width: 32, height: 32, color: "#fff", strokeWidth: 3 }} />
            )}
          </div>
          <h2 style={{ fontSize: 21, fontWeight: 900, margin: "0 0 6px", color: "#fff", letterSpacing: "-0.3px" }}>
            {status === "failure"
              ? "Pago No Completado"
              : status === "pending"
              ? "Pago en Proceso"
              : "¡Transferencia Exitosa!"}
          </h2>
          <p style={{ fontSize: 13, opacity: 0.95, margin: 0, color: "#fff" }}>
            {status === "failure"
              ? "El pago fue cancelado o rechazado por Mercado Pago."
              : "Tu pago por Mercado Pago fue acreditado con éxito."}
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px", backgroundColor: "#ffffff" }}>
          {status !== "failure" ? (
            <>
              {/* WhatsApp Instruction Notice */}
              <div
                style={{
                  background: "#ECFDF5",
                  border: "1.5px dashed #059669",
                  borderRadius: 14,
                  padding: "12px 14px",
                  marginBottom: 16,
                  fontSize: 13,
                  color: "#065F46",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <i
                  className="fab fa-whatsapp"
                  style={{ fontSize: 24, color: "#059669", marginTop: 2, flexShrink: 0 }}
                ></i>
                <div>
                  <strong style={{ display: "block", fontSize: 14, marginBottom: 2 }}>
                    ¡Paso final importante!
                  </strong>
                  Tocá el botón verde abajo para <strong>enviar tu pedido a WhatsApp</strong> al local y comenzar la preparación.
                </div>
              </div>

              {/* Order Summary Box */}
              {order && (
                <div
                  style={{
                    background: "#F8FAFC",
                    borderRadius: 14,
                    padding: "14px",
                    marginBottom: 16,
                    fontSize: 13,
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      fontWeight: 800,
                      fontSize: 14,
                    }}
                  >
                    <span>
                      Pedido #{order.id ? order.id.slice(-6).toUpperCase() : "OK"}
                    </span>
                    <span style={{ color: "#059669", fontWeight: 900, fontSize: 15 }}>
                      ${formatMoney(order.total || 0)}
                    </span>
                  </div>

                  {order.customerName && (
                    <div style={{ color: "#475569", fontSize: 12, marginBottom: 4 }}>
                      👤 <strong>Cliente:</strong> {order.customerName}
                    </div>
                  )}

                  {order.deliveryType && (
                    <div style={{ color: "#475569", fontSize: 12, marginBottom: 8 }}>
                      📍 <strong>Modalidad:</strong>{" "}
                      {order.deliveryType === "retiro"
                        ? "Retiro en local"
                        : `Envío (${order.customerAddress || "A domicilio"})`}
                    </div>
                  )}

                  {/* Item list */}
                  {Array.isArray(order.items) && order.items.length > 0 && (
                    <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 8 }}>
                      {order.items.map((it: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            marginBottom: 2,
                            color: "#334155",
                          }}
                        >
                          <span>
                            {it.quantity || 1}x {it.name || "Producto"}
                            {it.comment && <span style={{ color: "#64748B", fontStyle: "italic", marginLeft: 4 }}>({it.comment})</span>}
                          </span>
                          <span style={{ fontWeight: 600 }}>${formatMoney((it.price || 0) * (it.quantity || 1))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* WhatsApp Action Button */}
              <a
                href={getMPWhatsAppUrl(order)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: "100%",
                  padding: "14px 18px",
                  background: "#25D366",
                  color: "#fff",
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 15,
                  textDecoration: "none",
                  boxShadow: "0 6px 18px rgba(37, 211, 102, 0.4)",
                  marginBottom: 10,
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <i className="fab fa-whatsapp" style={{ fontSize: 20 }}></i>
                <span>Enviar Pedido a WhatsApp</span>
              </a>

              {/* Copy Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full py-2.5 mb-2 text-xs font-bold"
                onClick={onCopy}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "¡Copiado al portapapeles! ✅" : "Copiar detalle del pedido"}</span>
              </Button>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "transparent",
                  border: "none",
                  color: "var(--b1-color-text-muted)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cerrar y volver al menú
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: 14,
                  padding: "14px",
                  marginBottom: 16,
                  fontSize: 13,
                  color: "#991B1B",
                  textAlign: "center",
                }}
              >
                No se completó la transferencia de Mercado Pago. Podés intentar nuevamente o hacer tu pedido pagando en efectivo al recibirlo.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Button
                  type="button"
                  variant="default"
                  className="w-full py-3 text-sm font-bold"
                  onClick={onRetry}
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Intentar de nuevo
                </Button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    borderRadius: 12,
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cerrar y volver al menú
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
