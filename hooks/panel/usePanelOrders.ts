"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Order, OrderFilter, formatMoney, parseOrderItems } from "@/types/panel";
import { playNewOrderSound } from "@/lib/sound";

export function usePanelOrders(onOrderUpdated?: () => void) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);

  // Sound and Real-time Notification System
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<string>("default");
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const titleBlinkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [newOrderToast, setNewOrderToast] = useState<{
    id: string;
    customerName: string;
    total: number;
    paymentMethod: string;
  } | null>(null);

  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetchRef = useRef(true);

  // Delivery text for WhatsApp/Clipboard
  const formatDeliveryText = useCallback((order: Order) => {
    const isMP = order.paymentMethod === "mercadopago";
    let text = `*PEDIDO #${order.id.slice(-6).toUpperCase()} — ALAKARY*\n`;
    text += `*Cliente:* ${order.customerName}\n`;
    if (order.customerPhone) text += `*Teléfono:* ${order.customerPhone}\n`;
    text += `*Modalidad:* ${order.deliveryType === "retiro" ? "Retiro en Local" : `Envío a Domicilio (${order.customerAddress || "Sin dirección"})`}\n`;
    text += `*Pago:* ${isMP ? "Mercado Pago (Pagado Online)" : `Efectivo (Cobrar al entregar: $${formatMoney(order.total)})`}\n`;
    text += `\n*Detalle del pedido:*\n`;

    const itemsList = parseOrderItems(order.items);
    if (itemsList.length === 0) {
      text += `• 1x Pedido Alakary\n`;
    } else {
      itemsList.forEach((item: any) => {
        const qty = item.quantity || item.qty || 1;
        const name = item.name || item.title || "Producto";
        const price = item.price ? Number(item.price) * Number(qty) : 0;
        text += `• *${qty}x* ${name}`;
        if (item.comment) text += ` _(${item.comment})_`;
        if (price > 0) text += ` — $${formatMoney(price)}`;
        text += `\n`;
      });
    }

    text += `\n*TOTAL:* $${formatMoney(order.total)}\n`;
    return text;
  }, []);

  const handleCopyOrder = useCallback((order: Order) => {
    const text = formatDeliveryText(order);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedOrderId(order.id);
      setTimeout(() => {
        setCopiedOrderId(null);
      }, 2500);
    }
  }, [formatDeliveryText]);

  const handleCopyPhone = useCallback((phone: string, orderId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedOrderId(orderId);
      setTimeout(() => {
        setCopiedOrderId(null);
      }, 2000);
    }
  }, []);

  const handleShareWhatsApp = useCallback((order: Order) => {
    const text = formatDeliveryText(order);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, [formatDeliveryText]);

  // Trigger audio + Native System Notification (Windows Banner / Mobile Push / Title flash)
  const dispatchOrderAlert = useCallback((latest: Order) => {
    if (soundEnabled) {
      playNewOrderSound();
    }

    setNewOrderToast({
      id: latest.id,
      customerName: latest.customerName,
      total: latest.total,
      paymentMethod: latest.paymentMethod,
    });

    const shortId = latest.id.slice(-6).toUpperCase();
    const title = `¡Nuevo Pedido #${shortId} ($${formatMoney(latest.total)})!`;
    const body = `${latest.customerName} • Modalidad: ${latest.deliveryType === "retiro" ? "Retiro en local" : "Envío a domicilio"} • ${latest.paymentMethod === "mercadopago" ? "Mercado Pago" : "Efectivo"}`;

    if (swRegistrationRef.current && "showNotification" in swRegistrationRef.current) {
      swRegistrationRef.current
        .showNotification(title, {
          body,
          icon: "/assets/images/logo.png",
          badge: "/assets/images/logo.png",
          tag: "alakary-order-" + latest.id,
          renotify: true,
          requireInteraction: true,
          silent: false,
          data: { url: "/panel" },
        } as any)
        .catch(() => {
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(title, {
                body,
                icon: "/assets/images/logo.png",
                badge: "/assets/images/logo.png",
                tag: "alakary-order-" + latest.id,
                requireInteraction: true,
              });
            } catch {}
          }
        });
    } else if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/assets/images/logo.png",
          badge: "/assets/images/logo.png",
          tag: "alakary-order-" + latest.id,
          requireInteraction: true,
        });
      } catch {}
    }

    if (typeof document !== "undefined" && document.hidden) {
      if (titleBlinkIntervalRef.current) clearInterval(titleBlinkIntervalRef.current);
      let blink = false;
      titleBlinkIntervalRef.current = setInterval(() => {
        blink = !blink;
        document.title = blink
          ? `¡(1) NUEVO PEDIDO! ($${formatMoney(latest.total)})`
          : `#${shortId} ${latest.customerName} — Alakary`;
      }, 1000);
    }
  }, [soundEnabled]);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const incomingOrders: Order[] = data.orders;

        if (isFirstFetchRef.current) {
          isFirstFetchRef.current = false;
          knownOrderIdsRef.current = new Set(incomingOrders.map((o) => o.id));
        } else {
          const newOrders = incomingOrders.filter((o) => !knownOrderIdsRef.current.has(o.id));
          if (newOrders.length > 0) {
            const latest = newOrders[0];
            dispatchOrderAlert(latest);
            incomingOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
          }
        }

        setOrders(incomingOrders);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    }
  }, [dispatchOrderAlert]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === "granted") {
          playNewOrderSound();
          if (swRegistrationRef.current && "showNotification" in swRegistrationRef.current) {
            swRegistrationRef.current.showNotification("¡Notificaciones Activadas!", {
              body: "Recibirás alertas en tu pantalla con sonido cuando ingrese un nuevo pedido a Alakary.",
              icon: "/assets/images/logo.png",
            });
          }
        }
      } catch (e) {
        console.error("Permission error:", e);
      }
    }
  }, []);

  // Update order status (Approve / Reject)
  const handleUpdateOrderStatus = useCallback(async (orderId: string, newStatus: "aprobado" | "rechazado") => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (onOrderUpdated) onOrderUpdated();
      } else {
        alert(data.message || "Error al actualizar estado del pedido.");
      }
    } catch (e: any) {
      alert("Error de conexión: " + e.message);
    } finally {
      setUpdatingOrderId(null);
    }
  }, [onOrderUpdated]);

  // Clear all orders
  const handleClearAllOrders = useCallback(async () => {
    if (confirm("¿Estás seguro de que deseas limpiar todo el historial de pedidos?")) {
      try {
        const res = await fetch("/api/orders", { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          setOrders([]);
          alert("Historial de pedidos limpiado.");
        }
      } catch (e: any) {
        alert("Error al limpiar pedidos: " + e.message);
      }
    }
  }, []);

  // Stats
  const orderStats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    orders.forEach((o) => {
      if (o.status === "pendiente") pending++;
      else if (o.status === "aprobado") approved++;
      else if (o.status === "rechazado") rejected++;
    });
    return {
      total: orders.length,
      pending,
      approved,
      rejected,
    };
  }, [orders]);

  const pendingOrdersCount = orderStats.pending;

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (orderFilter === "all") return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  // Effects for SW and Unthrottled Worker Polling
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          swRegistrationRef.current = reg;
        })
        .catch((err) => {
          console.warn("Service worker registration error:", err);
        });
    }

    const handleFocus = () => {
      if (titleBlinkIntervalRef.current) {
        clearInterval(titleBlinkIntervalRef.current);
        titleBlinkIntervalRef.current = null;
      }
      if (typeof document !== "undefined") {
        document.title = "Alakary — Panel de Control";
      }
    };
    window.addEventListener("focus", handleFocus);

    let worker: Worker | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      const workerBlob = new Blob(
        [`setInterval(() => { self.postMessage('poll'); }, 3500);`],
        { type: "application/javascript" }
      );
      const workerUrl = URL.createObjectURL(workerBlob);
      worker = new Worker(workerUrl);
      worker.onmessage = () => {
        fetchOrders();
      };
    } catch {
      fallbackInterval = setInterval(fetchOrders, 3500);
    }

    return () => {
      window.removeEventListener("focus", handleFocus);
      if (titleBlinkIntervalRef.current) clearInterval(titleBlinkIntervalRef.current);
      if (worker) worker.terminate();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [fetchOrders]);

  return {
    orders,
    setOrders,
    orderFilter,
    setOrderFilter,
    updatingOrderId,
    selectedReceiptImage,
    setSelectedReceiptImage,
    soundEnabled,
    setSoundEnabled,
    notificationPermission,
    requestNotificationPermission,
    newOrderToast,
    setNewOrderToast,
    copiedOrderId,
    orderStats,
    pendingOrdersCount,
    filteredOrders,
    fetchOrders,
    handleUpdateOrderStatus,
    handleClearAllOrders,
    handleCopyOrder,
    handleCopyPhone,
    handleShareWhatsApp,
    formatDeliveryText,
  };
}
