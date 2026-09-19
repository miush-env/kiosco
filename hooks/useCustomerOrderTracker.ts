"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface ActiveDeliveryOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryType: "envio" | "retiro";
  total: number;
  status: "iniciado" | "pendiente" | "aprobado" | "rechazado";
  paymentMethod?: string;
  items?: any[];
  createdAt?: string;
}

// Reproducción de sonido de campana / chime suave mediante Web Audio API
function playDeliveryChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Tono 1 (Mi / E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Tono 2 (Sol# / G#5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(830.61, now + 0.15);
    gain2.gain.setValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);

    // Tono 3 (Si / B5 - Cierre alegre)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(987.77, now + 0.3);
    gain3.gain.setValueAtTime(0.4, now + 0.3);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.3);
    osc3.stop(now + 0.9);
  } catch (e) {
    console.warn("[Delivery Audio] Could not play synthesized chime:", e);
  }
}

export function useCustomerOrderTracker() {
  const [activeDeliveryAlert, setActiveDeliveryAlert] = useState<ActiveDeliveryOrder | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Solicitar permisos de notificación de navegador suavemente al montar
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  const checkOrdersStatus = useCallback(async () => {
    if (typeof window === "undefined") return;

    let ordersToCheck: ActiveDeliveryOrder[] = [];
    try {
      const stored = localStorage.getItem("kiosco_active_orders");
      if (stored) {
        ordersToCheck = JSON.parse(stored);
      } else {
        const last = localStorage.getItem("kiosco_last_order");
        if (last) ordersToCheck = [JSON.parse(last)];
      }
    } catch (e) {
      ordersToCheck = [];
    }

    if (!ordersToCheck || ordersToCheck.length === 0) return;

    // Verificar las órdenes más recientes (máximo 3 activas)
    for (const ord of ordersToCheck.slice(0, 3)) {
      if (!ord.id) continue;

      try {
        const res = await fetch(`/api/orders/check?id=${encodeURIComponent(ord.id)}`);
        const data = await res.json();

        if (data.success && data.order) {
          const remoteOrder = data.order;
          const currentStatus = remoteOrder.status;

          // Si el pedido fue aprobado por el admin
          if (currentStatus === "aprobado") {
            // Actualizar status local
            ord.status = "aprobado";

            // Si es un pedido de envío a domicilio y no fue notificado aún
            if (remoteOrder.deliveryType === "envio" || ord.deliveryType === "envio") {
              const notifKey = `kiosco_notif_delivered_${ord.id}`;
              const alreadyNotified = localStorage.getItem(notifKey);

              if (!alreadyNotified) {
                localStorage.setItem(notifKey, "true");

                // 1. Sonido de alerta
                playDeliveryChime();

                // 2. Notificación de sistema de navegador
                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                  try {
                    new Notification("🛵 Tu pedido Alakary", {
                      body: "El delivery esta llendo a la direccion indicado con tu pedido",
                      icon: "/assets/images/delivery-on-the-way.svg",
                    });
                  } catch (err) {}
                }

                // 3. Guardar en el historial de notificaciones del cliente
                try {
                  const existingNotifs = JSON.parse(localStorage.getItem("kiosco_customer_notifications") || "[]");
                  const newNotif = {
                    id: `notif_${ord.id}_${Date.now()}`,
                    title: "Delivery en Camino",
                    message: `El delivery esta llendo a la direccion indicado con tu pedido (${remoteOrder.customerAddress || ord.customerAddress || "tu domicilio"}).`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    orderId: ord.id,
                  };
                  localStorage.setItem("kiosco_customer_notifications", JSON.stringify([newNotif, ...existingNotifs].slice(0, 20)));
                  window.dispatchEvent(new Event("kiosco_customer_notifications_updated"));
                } catch (e) {}

                // 4. Mostrar Toast interactivo en pantalla
                setActiveDeliveryAlert({
                  ...ord,
                  customerAddress: remoteOrder.customerAddress || ord.customerAddress,
                  status: "aprobado",
                });
                setIsDismissed(false);
              }
            }
          }
        }
      } catch (err) {
        // Silencioso en caso de error de red puntual
      }
    }
  }, []);

  useEffect(() => {
    // Primera comprobación a los 1.5 segundos
    const initialTimer = setTimeout(() => {
      checkOrdersStatus();
    }, 1500);

    // Escuchar evento personalizado de actualización inmediata (ej. retorno de Mercado Pago)
    const handleOrderUpdated = () => {
      checkOrdersStatus();
    };
    window.addEventListener("kiosco_order_updated", handleOrderUpdated);

    // Polling cada 6 segundos para detección rápida
    pollTimerRef.current = setInterval(() => {
      checkOrdersStatus();
    }, 6000);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener("kiosco_order_updated", handleOrderUpdated);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [checkOrdersStatus]);

  const dismissAlert = () => {
    setIsDismissed(true);
  };

  return {
    activeDeliveryAlert: isDismissed ? null : activeDeliveryAlert,
    dismissAlert,
    checkOrdersStatus,
  };
}
