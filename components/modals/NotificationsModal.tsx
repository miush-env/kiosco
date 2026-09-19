"use client";

import React from "react";
import {
  Bell,
  BellOff,
  X,
  Trash2,
  ShoppingCart,
  Bike,
  Store,
  CreditCard,
  Clock,
  Activity,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { Product } from "@/components/home/ProductCard";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCart?: () => void;
  products?: Product[];
}

// Helper para erradicar cualquier emoji residual proveniente del backend o almacenamiento previo
const cleanText = (txt?: string) =>
  txt ? txt.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim() : "";

export default function NotificationsModal({
  isOpen,
  onClose,
  onOpenCart,
  products,
}: NotificationsModalProps) {
  const [customerNotifs, setCustomerNotifs] = React.useState<any[]>([]);
  const unreadIdsOnOpenRef = React.useRef<Set<string | number>>(new Set());

  React.useEffect(() => {
    if (!isOpen) {
      unreadIdsOnOpenRef.current = new Set();
      return;
    }

    const loadAndMarkNotifs = () => {
      if (typeof window === "undefined") return;
      try {
        const stored = localStorage.getItem("kiosco_customer_notifications");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCustomerNotifs(parsed);

            // Detectar cuáles notificaciones eran nuevas antes de marcarlas
            const newUnreads = new Set<string | number>();
            let hasUnread = false;

            const markedAsRead = parsed.map((n: any) => {
              if (n && n.read !== true) {
                hasUnread = true;
                newUnreads.add(n.id);
                return { ...n, read: true };
              }
              return n;
            });

            if (newUnreads.size > 0) {
              // Conservar IDs no leídos durante esta sesión de visualización
              unreadIdsOnOpenRef.current = new Set([
                ...Array.from(unreadIdsOnOpenRef.current),
                ...Array.from(newUnreads),
              ]);
            }

            if (hasUnread) {
              localStorage.setItem("kiosco_customer_notifications", JSON.stringify(markedAsRead));
              // Notificar al AppHeader para que borre el contador y el badge de la campana de inmediato
              window.dispatchEvent(new Event("kiosco_customer_notifications_updated"));
            }
          } else {
            setCustomerNotifs([]);
          }
        } else {
          setCustomerNotifs([]);
        }
      } catch (e) {
        setCustomerNotifs([]);
      }
    };

    loadAndMarkNotifs();
    window.addEventListener("kiosco_customer_notifications_updated", loadAndMarkNotifs);
    return () => {
      window.removeEventListener("kiosco_customer_notifications_updated", loadAndMarkNotifs);
    };
  }, [isOpen]);

  const handleCloseModal = () => {
    try {
      const stored = localStorage.getItem("kiosco_customer_notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.some((n: any) => n && n.read !== true)) {
          const marked = parsed.map((n: any) => ({ ...n, read: true }));
          localStorage.setItem("kiosco_customer_notifications", JSON.stringify(marked));
          window.dispatchEvent(new Event("kiosco_customer_notifications_updated"));
        }
      }
    } catch (e) {}
    unreadIdsOnOpenRef.current = new Set();
    onClose();
  };

  const handleClearNotifs = () => {
    setCustomerNotifs([]);
    unreadIdsOnOpenRef.current = new Set();
    try {
      localStorage.removeItem("kiosco_customer_notifications");
      window.dispatchEvent(new Event("kiosco_customer_notifications_updated"));
    } catch (e) {}
  };

  const handleDeleteSingleNotif = (id: string | number) => {
    setCustomerNotifs((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      try {
        localStorage.setItem("kiosco_customer_notifications", JSON.stringify(updated));
        window.dispatchEvent(new Event("kiosco_customer_notifications_updated"));
      } catch (e) {}
      return updated;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="b1-modal-backdrop" onClick={handleCloseModal}>
      <div
        className="b1-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: "86vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "26px 26px 0 0",
          overflow: "hidden",
        }}
      >
        {/* Tirador superior para arrastre / dismiss táctil */}
        <div style={{ padding: "12px 0 4px", display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: 44,
              height: 5,
              borderRadius: 3,
              background: "var(--b1-color-border, #CBD5E1)",
            }}
          />
        </div>

        {/* Cabecera del Modal con Título a la Izquierda y Botón X a la Derecha */}
        <div
          style={{
            padding: "12px 22px 18px",
            borderBottom: "1px solid var(--b1-color-border-light, #E2E8F0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: "rgba(255, 94, 58, 0.14)",
                color: "var(--b1-color-primary, #EA580C)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Bell style={{ width: 24, height: 24 }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 900,
                  color: "var(--b1-color-text-main, #1E1B18)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.3px",
                }}
              >
                Avisos y Novedades
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "var(--b1-color-text-muted, #78716C)",
                  fontWeight: 500,
                  marginTop: 3,
                  lineHeight: 1.25,
                }}
              >
                Notificaciones y estado de tus pedidos
              </p>
            </div>
          </div>

          {/* Botón Cerrar (X) grande y accesible al lado derecho */}
          <button
            type="button"
            className="b1-modal-close-btn"
            onClick={handleCloseModal}
            aria-label="Cerrar modal"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <X style={{ width: 18, height: 18, strokeWidth: 2.5 }} />
          </button>
        </div>

        {/* Cuerpo del Modal con scroll */}
        <div
          style={{
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          {/* Sección 1: Actividad y Notificaciones */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Activity style={{ width: 18, height: 18, color: "var(--b1-color-text-muted, #78716C)" }} />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    color: "var(--b1-color-text-main, #1E1B18)",
                  }}
                >
                  Actividad Reciente
                </span>
                {customerNotifs.length > 0 && (
                  <span
                    style={{
                      background: "var(--b1-color-surface-subtle, #E2E8F0)",
                      color: "var(--b1-color-text-main, #1E293B)",
                      fontSize: 12.5,
                      fontWeight: 900,
                      padding: "2px 8px",
                      borderRadius: 9999,
                      border: "1px solid var(--b1-color-border, transparent)",
                    }}
                  >
                    {customerNotifs.length}
                  </span>
                )}
              </div>

              {/* Botón con estilo real para Limpiar historial */}
              {customerNotifs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearNotifs}
                  style={{
                    background: "#FEE2E2",
                    border: "1.5px solid #FECACA",
                    color: "#DC2626",
                    fontSize: 13,
                    fontWeight: 800,
                    borderRadius: 10,
                    padding: "7px 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 3px rgba(220, 38, 38, 0.08)",
                  }}
                  title="Limpiar todo el historial de notificaciones"
                >
                  <Trash2 style={{ width: 15, height: 15 }} />
                  <span>Limpiar historial</span>
                </button>
              )}
            </div>

            {/* Listado de notificaciones */}
            {customerNotifs.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {customerNotifs.map((n) => {
                  const isCart = n.type === "cart" || String(n.id).includes("cart");
                  const titleClean = cleanText(n.title) || (isCart ? "Agregado al carrito" : "Delivery en Camino");
                  const messageClean = cleanText(n.message);

                  // Buscar foto del producto en la notificación o en el catálogo por nombre
                  const matchedProduct = isCart && products ? products.find((p) => {
                    const target = (n.productName || titleClean).trim().toLowerCase();
                    return p.name.trim().toLowerCase() === target || target.includes(p.name.trim().toLowerCase());
                  }) : null;

                  const resolvedImage = n.productImage || matchedProduct?.image || null;

                  return (
                    <div
                      key={n.id}
                      style={{
                        background: "var(--b1-color-surface, #FFFFFF)",
                        border: isCart ? "1.5px solid rgba(255, 94, 58, 0.3)" : "1.5px solid rgba(16, 185, 129, 0.3)",
                        borderRadius: 18,
                        padding: "16px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        boxShadow: "var(--b1-shadow-sm, 0 3px 10px rgba(0, 0, 0, 0.05))",
                        position: "relative",
                      }}
                    >
                      {/* Imagen real del producto (NO icono de carrito duplicado) */}
                      {isCart ? (
                        resolvedImage ? (
                          <div
                            style={{
                              width: 62,
                              height: 62,
                              borderRadius: 14,
                              overflow: "hidden",
                              flexShrink: 0,
                              border: "1.5px solid var(--b1-color-border, #E2E8F0)",
                              background: "var(--b1-color-surface-subtle, #F8FAFC)",
                              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
                            }}
                          >
                            <img
                              src={resolvedImage}
                              alt={n.productName || titleClean}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: 62,
                              height: 62,
                              borderRadius: 14,
                              background: "rgba(255, 94, 58, 0.12)",
                              color: "var(--b1-color-primary, #FF5030)",
                              border: "1.5px solid rgba(255, 94, 58, 0.25)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <UtensilsCrossed style={{ width: 28, height: 28 }} />
                          </div>
                        )
                      ) : (
                        <div
                          style={{
                            width: 62,
                            height: 62,
                            borderRadius: 14,
                            background: "rgba(16, 185, 129, 0.12)",
                            color: "var(--b1-color-success, #059669)",
                            border: "1.5px solid rgba(16, 185, 129, 0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Bike style={{ width: 30, height: 30 }} />
                        </div>
                      )}

                      {/* Contenido de la notificación con tipografía grande y accesible */}
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: 16.5,
                            color: isCart ? "var(--b1-color-primary, #FF5030)" : "var(--b1-color-success, #065F46)",
                            lineHeight: 1.25,
                            marginBottom: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span>{titleClean}</span>
                          {unreadIdsOnOpenRef.current.has(n.id) && (
                            <span
                              style={{
                                background: "rgba(245, 158, 11, 0.16)",
                                color: "var(--b1-color-accent, #D97706)",
                                border: "1px solid rgba(245, 158, 11, 0.35)",
                                fontSize: 11,
                                fontWeight: 800,
                                padding: "1px 7px",
                                borderRadius: 6,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: "#F59E0B",
                                }}
                              />
                              Nueva
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 15,
                            color: "var(--b1-color-text-body, #4A453E)",
                            lineHeight: 1.4,
                            fontWeight: 500,
                          }}
                        >
                          {messageClean}
                        </div>
                        {n.timestamp && (
                          <div
                            style={{
                              fontSize: 13,
                              color: "var(--b1-color-text-muted, #64748B)",
                              marginTop: 6,
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Clock style={{ width: 13, height: 13, color: "var(--b1-color-text-muted, #94A3B8)" }} />
                            <span>
                              {new Date(n.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}

                        {/* Botón para ver el carrito con icono y tamaño accesible */}
                        {onOpenCart && (
                          <div style={{ marginTop: 10 }}>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenCart();
                              }}
                              style={{
                                background: isCart ? "rgba(255, 94, 58, 0.12)" : "rgba(16, 185, 129, 0.12)",
                                border: isCart ? "1.5px solid rgba(255, 94, 58, 0.3)" : "1.5px solid rgba(16, 185, 129, 0.3)",
                                color: isCart ? "var(--b1-color-primary, #FF5030)" : "var(--b1-color-success, #065F46)",
                                fontSize: 13.5,
                                fontWeight: 800,
                                borderRadius: 10,
                                padding: "7px 16px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 7,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                              }}
                              className="hover:opacity-90 active:scale-95 cursor-pointer"
                            >
                              <ShoppingCart style={{ width: 15, height: 15 }} />
                              <span>Ver carrito</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Botón individual accesible para borrar esta notificación */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSingleNotif(n.id)}
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          width: 32,
                          height: 32,
                          background: "var(--b1-color-surface-subtle, #F1F5F9)",
                          border: "1px solid var(--b1-color-border, transparent)",
                          color: "var(--b1-color-text-muted, #64748B)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 8,
                          transition: "all 0.15s ease",
                        }}
                        className="hover:opacity-80 active:scale-90"
                        title="Eliminar esta notificación"
                        aria-label="Eliminar notificación"
                      >
                        <X style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Estado vacío cuando no hay notificaciones */
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1.5px dashed #CBD5E1",
                  borderRadius: 18,
                  padding: "28px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 9999,
                    background: "#F1F5F9",
                    color: "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <BellOff style={{ width: 26, height: 26 }} />
                </div>
                <div style={{ fontWeight: 900, fontSize: 16.5, color: "#1E293B", margin: 0 }}>
                  No tenés notificaciones recientes
                </div>
                <p style={{ margin: 0, fontSize: 14, color: "#475569", marginTop: 4, fontWeight: 500 }}>
                  Los avisos de tus pedidos y compras aparecerán acá.
                </p>
              </div>
            )}
          </div>

          {/* Sección 2: Novedades e Información del Comercio - SOLO VISIBLE CUANDO NO HAY ACTIVIDAD RECIENTE */}
          {customerNotifs.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles style={{ width: 18, height: 18, color: "var(--b1-color-text-muted, #78716C)" }} />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    color: "var(--b1-color-text-main, #1E1B18)",
                  }}
                >
                  Información del Local
                </span>
              </div>

              {/* Tarjeta 1: Bienvenidos */}
              <div
                style={{
                  background: "var(--b1-color-surface-subtle, #FFFBF7)",
                  border: "1.5px solid var(--b1-color-border, #FED7AA)",
                  borderRadius: 18,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  boxShadow: "var(--b1-shadow-xs, 0 2px 8px rgba(234, 88, 12, 0.05))",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "rgba(255, 94, 58, 0.12)",
                    color: "var(--b1-color-primary, #EA580C)",
                    border: "1.5px solid rgba(255, 94, 58, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Store style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 16.5,
                      color: "var(--b1-color-primary, #9A3412)",
                      marginBottom: 4,
                      lineHeight: 1.25,
                    }}
                  >
                    ¡Bienvenidos a Alakary!
                  </div>
                  <div style={{ fontSize: 14, color: "var(--b1-color-text-body, #7C2D12)", lineHeight: 1.5, fontWeight: 500 }}>
                    Pedí online tus pizzas, empanadas y bebidas favoritas con entrega rápida a domicilio o retiro en el local.
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Métodos de Pago */}
              <div
                style={{
                  background: "var(--b1-color-surface-subtle, #F0F9FF)",
                  border: "1.5px solid var(--b1-color-border, #BAE6FD)",
                  borderRadius: 18,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  boxShadow: "var(--b1-shadow-xs, 0 2px 8px rgba(0, 158, 227, 0.05))",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "rgba(0, 158, 227, 0.12)",
                    color: "#007BB0",
                    border: "1.5px solid rgba(0, 158, 227, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CreditCard style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 16.5,
                      color: "var(--b1-color-text-main, #0369A1)",
                      marginBottom: 4,
                      lineHeight: 1.25,
                    }}
                  >
                    Pagos por Mercado Pago y Efectivo
                  </div>
                  <div style={{ fontSize: 14, color: "var(--b1-color-text-body, #075985)", lineHeight: 1.5, fontWeight: 500 }}>
                    Generá tu link de pago oficial con Mercado Pago o aboná en efectivo cuando recibís tu pedido.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
