"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  Volume2,
  VolumeX,
  RefreshCw,
  Trash2,
  Plus,
  Share2,
  Copy,
  Check,
  Package,
  BarChart3,
  Search,
  ExternalLink,
} from "lucide-react";

interface Lot {
  id: string;
  qty: number;
  expirationDate: string | null;
  addedDate: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  stock: number;
  unit?: string;
  minAlert?: number;
  icon?: string;
  barcode?: string | null;
  lots: Lot[];
  source?: "local" | "sheets";
}

interface InventoryStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface Sale {
  id: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: string;
  description?: string;
  source: string;
}

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  source: string;
}

interface Order {
  id: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  deliveryType: "envio" | "retiro";
  items: { name: string; quantity: number; price: number; comment?: string }[];
  total: number;
  paymentMethod: string;
  transferRef?: string;
  receiptImage?: string;
  status: "pendiente" | "aprobado" | "rechazado" | "iniciado";
  createdAt?: string;
}

function formatMoney(amount: number | string): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-AR");
}

// Sound chime generator using Web Audio API (cross-browser, no external audio files required)
function playNewOrderSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Upbeat 3-note notification chime (D5 -> F#5 -> A5)
    playTone(587.33, 0.0, 0.22);
    playTone(739.99, 0.14, 0.22);
    playTone(880.00, 0.28, 0.45);
  } catch (e) {
    console.error("Audio chime error:", e);
  }
}

export default function AdminStockAndFinancePage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");

  const [activeTab, setActiveTab] = useState<"orders" | "stock" | "finance">("orders");

  useEffect(() => {
    if (tabParam === "stock" || tabParam === "finance" || tabParam === "orders") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<"all" | "pendiente" | "aprobado" | "rechazado">("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);

  // Sound and Real-time Notification System
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderToast, setNewOrderToast] = useState<{
    id: string;
    customerName: string;
    total: number;
    paymentMethod: string;
  } | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetchRef = useRef(true);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(true);
  const syncTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingStockUpdatesRef = useRef<Record<string, number>>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "normal" | "low" | "out">("all");

  // Finance state
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [financePeriod, setFinancePeriod] = useState<"today" | "week" | "month" | "all">("today");

  // Modals state
  const [isAddLotOpen, setIsAddLotOpen] = useState(false);
  const [selectedItemForLot, setSelectedItemForLot] = useState<InventoryItem | null>(null);
  const [lotQty, setLotQty] = useState<string>("1");
  const [lotExpDate, setLotExpDate] = useState<string>("");
  const [lotCost, setLotCost] = useState<string>("");

  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Carnes");
  const [newItemUnit, setNewItemUnit] = useState("unidades");
  const [newItemBarcode, setNewItemBarcode] = useState("");
  const [newItemMinAlert, setNewItemMinAlert] = useState<string>("15");
  const [newItemQty, setNewItemQty] = useState<string>("0");
  const [newItemCost, setNewItemCost] = useState("");

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishItem, setPublishItem] = useState<InventoryItem | null>(null);
  const [publishPrice, setPublishPrice] = useState("");

  const [isManualSaleOpen, setIsManualSaleOpen] = useState(false);
  const [manualSaleAmount, setManualSaleAmount] = useState("");
  const [manualSaleDesc, setManualSaleDesc] = useState("Venta de mostrador");
  const [manualSaleMethod, setManualSaleMethod] = useState("efectivo");

  const [isManualExpenseOpen, setIsManualExpenseOpen] = useState(false);
  const [manualExpenseAmount, setManualExpenseAmount] = useState("");
  const [manualExpenseDesc, setManualExpenseDesc] = useState("");
  const [manualExpenseCategory, setManualExpenseCategory] = useState("general");

  // Helper to parse order items safely from JSON string, array, or object
  const parseOrderItems = (rawItems: any): any[] => {
    if (Array.isArray(rawItems)) return rawItems;
    if (typeof rawItems === "string") {
      try {
        const parsed = JSON.parse(rawItems);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    if (rawItems && typeof rawItems === "object") {
      try {
        const vals = Object.values(rawItems);
        if (Array.isArray(vals)) return vals;
      } catch {}
    }
    return [];
  };

  // Helper to build formatted message for delivery driver
  const formatDeliveryText = (order: Order) => {
    const isMP = order.paymentMethod === "mercadopago";
    let text = `🍕 *PEDIDO #${order.id.slice(-6).toUpperCase()} — ALAKARY*\n`;
    text += `👤 *Cliente:* ${order.customerName}\n`;
    if (order.customerPhone) text += `📱 *Teléfono:* ${order.customerPhone}\n`;
    text += `📍 *Modalidad:* ${order.deliveryType === "retiro" ? "Retiro en Local" : `Envío a Domicilio (${order.customerAddress || "Sin dirección"})`}\n`;
    text += `💳 *Pago:* ${isMP ? "Mercado Pago (Pagado Online ✅)" : `Efectivo (Cobrar al entregar: $${formatMoney(order.total)} 💵)`}\n`;
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

    text += `\n💰 *TOTAL:* $${formatMoney(order.total)}\n`;
    return text;
  };

  const handleCopyOrder = (order: Order) => {
    const text = formatDeliveryText(order);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedOrderId(order.id);
      setTimeout(() => {
        setCopiedOrderId(null);
      }, 2500);
    }
  };

  const handleShareWhatsApp = (order: Order) => {
    const text = formatDeliveryText(order);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Fetch initial data & live orders
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const incomingOrders: Order[] = data.orders;

        if (isFirstFetchRef.current) {
          isFirstFetchRef.current = false;
          knownOrderIdsRef.current = new Set(incomingOrders.map((o) => o.id));
        } else {
          // Detect newly arrived orders
          const newOrders = incomingOrders.filter((o) => !knownOrderIdsRef.current.has(o.id));
          if (newOrders.length > 0) {
            const latest = newOrders[0];
            if (soundEnabled) {
              playNewOrderSound();
            }
            setNewOrderToast({
              id: latest.id,
              customerName: latest.customerName,
              total: latest.total,
              paymentMethod: latest.paymentMethod,
            });

            // Native Browser Notification if permitted
            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              try {
                new Notification(`🔔 ¡Nuevo Pedido #${latest.id.slice(-6).toUpperCase()}!`, {
                  body: `${latest.customerName} • $${formatMoney(latest.total)} (${latest.paymentMethod === "mercadopago" ? "Mercado Pago" : "Efectivo"})`,
                  icon: "/assets/images/logo.png",
                });
              } catch (err) {}
            }

            // Update known orders set
            incomingOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
          }
        }

        setOrders(incomingOrders);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await fetchOrders();

      const invRes = await fetch("/api/inventory");
      const invData = await invRes.json();
      if (invData.success) {
        setInventory(invData.inventory || []);
        setStats(invData.stats || { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
      }

      const salesRes = await fetch("/api/finance/sales");
      const salesData = await salesRes.json();
      if (salesData.success) setSales(salesData.sales || []);

      const expRes = await fetch("/api/finance/expenses");
      const expData = await expRes.json();
      if (expData.success) setExpenses(expData.expenses || []);
    } catch (e) {
      console.error("Error fetching admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchOrders, 4000); // 4s fast polling for live real-time notifications
    return () => {
      clearInterval(interval);
      Object.values(syncTimersRef.current).forEach((t) => clearTimeout(t));
    };
  }, [soundEnabled]);

  // Update order status (Verify transfer / Approve / Reject)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: "aprobado" | "rechazado") => {
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
        fetchData(); // Refresh finance and inventory
      } else {
        alert(data.message || "Error al actualizar estado del pedido.");
      }
    } catch (e: any) {
      alert("Error de conexión: " + e.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }

      const minThreshold = item.minAlert !== undefined ? item.minAlert : 15;
      if (stockStatusFilter === "out" && item.stock > 0) return false;
      if (stockStatusFilter === "low" && (item.stock <= 0 || item.stock >= minThreshold)) return false;
      if (stockStatusFilter === "normal" && item.stock < minThreshold) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (item.name || "").toLowerCase().includes(q);
        const matchCat = (item.category || "").toLowerCase().includes(q);
        const matchBarcode = (item.barcode || "").includes(q);
        if (!matchName && !matchCat && !matchBarcode) return false;
      }

      return true;
    });
  }, [inventory, selectedCategory, stockStatusFilter, searchQuery]);

  // Unique categories list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((i) => {
      if (i.category && i.category.toLowerCase() !== "todos" && i.category.toLowerCase() !== "all") {
        set.add(i.category);
      }
    });
    return Array.from(set);
  }, [inventory]);

  // Quick delta adjustment with instant optimistic UI + Debounced Server Sync
  const handleQuickDelta = (id: string, delta: number) => {
    // 1. Calculate synchronous target stock from pending ref or current state
    const currentItem = inventory.find((i) => i.id === id);
    const baseStock =
      pendingStockUpdatesRef.current[id] !== undefined
        ? pendingStockUpdatesRef.current[id]
        : Number(currentItem?.stock || 0);

    const targetStock = Math.max(0, baseStock + delta);
    pendingStockUpdatesRef.current[id] = targetStock;

    // 2. Instant optimistic UI update
    setInventory((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          return { ...item, stock: targetStock };
        }
        return item;
      });

      // Recalculate stats optimistically
      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;
      updated.forEach((item) => {
        const minThreshold = item.minAlert !== undefined ? item.minAlert : 15;
        const s = Number(item.stock) || 0;
        if (s <= 0) outOfStock++;
        else if (s < minThreshold) lowStock++;
        else inStock++;
      });
      setStats({ total: updated.length, inStock, lowStock, outOfStock });

      return updated;
    });

    // 3. Clear any active debounce timer for this item
    if (syncTimersRef.current[id]) {
      clearTimeout(syncTimersRef.current[id]);
    }

    // 4. Send single debounced request 300ms after the last click
    syncTimersRef.current[id] = setTimeout(async () => {
      delete syncTimersRef.current[id];

      try {
        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, setStock: targetStock }),
        });
        const data = await res.json();
        delete pendingStockUpdatesRef.current[id];
        // If user hasn't clicked again while request was in-flight, reconcile
        if (data.success && data.item && pendingStockUpdatesRef.current[id] === undefined) {
          setInventory((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...data.item } : item))
          );
          if (data.stats) {
            setStats(data.stats);
          }
        }
      } catch (e) {
        console.error("Error updating stock in background:", e);
      }
    }, 300);
  };

  // Add Lot Submit
  const handleAddLotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedQty = Math.max(1, parseInt(lotQty, 10) || 1);
    if (!selectedItemForLot || parsedQty <= 0) return;

    try {
      const res = await fetch("/api/inventory/add-lot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItemForLot.id,
          name: selectedItemForLot.name,
          qty: parsedQty,
          expirationDate: lotExpDate || null,
          cost: parseFloat(lotCost) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInventory((prev) =>
          prev.map((item) => (item.id === selectedItemForLot.id ? data.item : item))
        );
        setStats(data.stats);
        setIsAddLotOpen(false);
        setSelectedItemForLot(null);
        setLotQty("1");
        setLotExpDate("");
        setLotCost("");
        fetchData();
      }
    } catch (err) {
      alert("Error al agregar lote");
    }
  };

  // Create Insumo Submit
  const handleCreateItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const res = await fetch("/api/inventory/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItemName,
          category: newItemCategory,
          unit: newItemUnit,
          barcode: newItemBarcode || null,
          minAlert: Math.max(0, parseInt(newItemMinAlert, 10) || 15),
          qty: Math.max(0, parseInt(newItemQty, 10) || 0),
          cost: parseFloat(newItemCost) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        setIsCreateItemOpen(false);
        setNewItemName("");
        setNewItemBarcode("");
        setNewItemQty("0");
        setNewItemCost("");
      }
    } catch (err) {
      alert("Error al crear insumo");
    }
  };

  // Publish to menu submit
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishItem || !publishPrice) return;

    try {
      const res = await fetch("/api/menu/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId: publishItem.id,
          name: publishItem.name,
          price: publishPrice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`¡"${publishItem.name}" publicado en la carta con éxito!`);
        setIsPublishModalOpen(false);
        setPublishItem(null);
        setPublishPrice("");
      }
    } catch (err) {
      alert("Error al publicar en la carta");
    }
  };

  // Manual Sale Submit
  const handleManualSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSaleAmount) return;

    try {
      const res = await fetch("/api/finance/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: manualSaleAmount,
          description: manualSaleDesc,
          paymentMethod: manualSaleMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSales((prev) => [data.sale, ...prev]);
        setIsManualSaleOpen(false);
        setManualSaleAmount("");
      }
    } catch (err) {
      alert("Error al registrar venta");
    }
  };

  // Manual Expense Submit
  const handleManualExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualExpenseAmount || !manualExpenseDesc) return;

    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: manualExpenseAmount,
          description: manualExpenseDesc,
          category: manualExpenseCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExpenses((prev) => [data.expense, ...prev]);
        setIsManualExpenseOpen(false);
        setManualExpenseAmount("");
        setManualExpenseDesc("");
      }
    } catch (err) {
      alert("Error al registrar gasto");
    }
  };

  // Finance calculations based on selected period
  const filteredSales = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const localToday = new Date().toLocaleDateString("en-CA");
    const now = new Date();

    return sales.filter((s) => {
      if (financePeriod === "all") return true;
      if (financePeriod === "today") return s.date === today || s.date === localToday;
      const saleDate = new Date(s.date + "T12:00:00");
      const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
      if (financePeriod === "week") return diffDays <= 7 && diffDays >= -1;
      if (financePeriod === "month") return diffDays <= 30 && diffDays >= -1;
      return true;
    });
  }, [sales, financePeriod]);

  const filteredExpenses = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const localToday = new Date().toLocaleDateString("en-CA");
    const now = new Date();

    return expenses.filter((e) => {
      if (financePeriod === "all") return true;
      if (financePeriod === "today") return e.date === today || e.date === localToday;
      const expDate = new Date(e.date + "T12:00:00");
      const diffDays = (now.getTime() - expDate.getTime()) / (1000 * 3600 * 24);
      if (financePeriod === "week") return diffDays <= 7 && diffDays >= -1;
      if (financePeriod === "month") return diffDays <= 30 && diffDays >= -1;
      return true;
    });
  }, [expenses, financePeriod]);

  const totalIncome = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  }, [filteredSales]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const netBalance = totalIncome - totalExpense;

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "pendiente").length;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderFilter === "all") return true;
      return o.status === orderFilter;
    });
  }, [orders, orderFilter]);

  return (
    <div style={{ padding: "14px 18px 24px" }}>
      {/* ── REAL-TIME NEW ORDER TOAST ALERT ─────────────────────────────── */}
      {newOrderToast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999999,
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4), 0 0 0 2px #10B981",
            display: "flex",
            alignItems: "center",
            gap: 12,
            maxWidth: "92vw",
            width: 480,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            <Bell style={{ width: 20, height: 20 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#34D399", display: "flex", alignItems: "center", gap: 6 }}>
              <span>¡NUEVO PEDIDO RECIBIDO!</span>
              <span style={{ fontSize: 10, background: "#065F46", padding: "1px 6px", borderRadius: 6, color: "#A7F3D0" }}>
                {newOrderToast.paymentMethod === "mercadopago" ? "Mercado Pago" : "Efectivo"}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              #{newOrderToast.id.slice(-6).toUpperCase()} • {newOrderToast.customerName} • ${formatMoney(newOrderToast.total)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewOrderToast(null);
              setActiveTab("orders");
            }}
            style={{
              background: "#10B981",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 10px",
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Ver
          </button>
          <button
            type="button"
            onClick={() => setNewOrderToast(null)}
            style={{
              background: "transparent",
              color: "#94A3B8",
              border: "none",
              fontSize: 16,
              cursor: "pointer",
              padding: "4px 6px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── ACTIONS TOOLBAR ───────────────────────────────────────────── */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--b1-color-text-main)", margin: 0, letterSpacing: "-0.2px" }}>
            {activeTab === "orders" ? "Gestión de Pedidos" : activeTab === "stock" ? "Control de Stock" : "Balance y Finanzas"}
          </h2>
          {activeTab === "orders" && pendingOrdersCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 800, background: "#FEE2E2", color: "#DC2626", padding: "2px 8px", borderRadius: 12 }}>
              {pendingOrdersCount} {pendingOrdersCount === 1 ? "pendiente" : "pendientes"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {activeTab === "orders" && (
            <>
              {/* Sound & Alert notification button */}
              <button
                type="button"
                className="adm-btn-sm-primary"
                onClick={() => {
                  if (!soundEnabled) {
                    playNewOrderSound();
                  }
                  if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
                    Notification.requestPermission();
                  }
                  setSoundEnabled(!soundEnabled);
                }}
                title={soundEnabled ? "Notificaciones de sonido activadas (Click para probar / desactivar)" : "Notificaciones de sonido desactivadas"}
                style={{
                  background: soundEnabled ? "#ECFDF5" : "var(--b1-color-surface-subtle, #F1F5F9)",
                  color: soundEnabled ? "#059669" : "var(--b1-color-text-muted, #64748B)",
                  border: "1px solid " + (soundEnabled ? "#6EE7B7" : "var(--b1-color-border, #CBD5E1)"),
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                {soundEnabled ? (
                  <Volume2 style={{ width: 14, height: 14, color: "#059669" }} />
                ) : (
                  <VolumeX style={{ width: 14, height: 14 }} />
                )}
                <span>{soundEnabled ? "Sonido ON" : "Sonido OFF"}</span>
              </button>

              <button
                type="button"
                className="adm-btn-sm-primary"
                onClick={fetchOrders}
                title="Recargar pedidos"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
                <span>Actualizar</span>
              </button>

              <button
                type="button"
                className="adm-btn-sm-danger"
                onClick={async () => {
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
                }}
                title="Limpiar pedidos"
                style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
              >
                <Trash2 style={{ width: 14, height: 14 }} />
                <span>Limpiar</span>
              </button>
            </>
          )}

          {activeTab === "stock" && (
            <button
              type="button"
              className="adm-btn-sm-primary"
              onClick={() => setIsCreateItemOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            >
              <Plus style={{ width: 14, height: 14 }} />
              <span>Nuevo Insumo</span>
            </button>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           TAB: CONTROL DE PEDIDOS & COBROS
           ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "orders" && (
        <div style={{ paddingTop: 14 }}>
          {/* Order Filters */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
            <button
              type="button"
              className={`adm-filter-btn ${orderFilter === "all" ? "active" : ""}`}
              onClick={() => setOrderFilter("all")}
            >
              Todos ({orders.length})
            </button>
            <button
              type="button"
              className={`adm-filter-btn ${orderFilter === "pendiente" ? "active" : ""}`}
              onClick={() => setOrderFilter("pendiente")}
              style={orderFilter === "pendiente" ? { background: "#FEF3C7", borderColor: "#F59E0B", color: "#92400E" } : undefined}
            >
              💵 Efectivo Pendiente ({orders.filter((o) => o.paymentMethod === "efectivo" && o.status === "pendiente").length})
            </button>
            <button
              type="button"
              className={`adm-filter-btn ${orderFilter === "aprobado" ? "active" : ""}`}
              onClick={() => setOrderFilter("aprobado")}
              style={orderFilter === "aprobado" ? { background: "#D1FAE5", borderColor: "#10B981", color: "#065F46" } : undefined}
            >
              🟢 Cobrados / Pagados ({orders.filter((o) => o.status === "aprobado").length})
            </button>
            <button
              type="button"
              className={`adm-filter-btn ${orderFilter === "rechazado" ? "active" : ""}`}
              onClick={() => setOrderFilter("rechazado")}
              style={orderFilter === "rechazado" ? { background: "#FEE2E2", borderColor: "#EF4444", color: "#991B1B" } : undefined}
            >
              🔴 Cancelados ({orders.filter((o) => o.status === "rechazado").length})
            </button>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="adm-empty-state" style={{ padding: "40px 20px", textAlign: "center", background: "#fff", borderRadius: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>No hay pedidos en esta sección</div>
              <div style={{ color: "var(--b1-color-text-muted)", fontSize: 13, marginTop: 4 }}>
                Los nuevos pedidos en efectivo y por Mercado Pago aparecerán acá en tiempo real.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filteredOrders.map((order) => {
                const isPending = order.status === "pendiente";
                const isApproved = order.status === "aprobado";
                const isRejected = order.status === "rechazado";
                const isMP = order.paymentMethod === "mercadopago";
                const isCash = order.paymentMethod === "efectivo" || !order.paymentMethod;

                return (
                  <div
                    key={order.id}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      border: isPending ? "2px solid #F59E0B" : isMP ? "1.5px solid rgba(0, 158, 227, 0.35)" : "1px solid var(--adm-border)",
                      boxShadow: isPending ? "0 4px 14px rgba(245, 158, 11, 0.15)" : "0 2px 6px rgba(0,0,0,0.04)",
                      padding: 16,
                      position: "relative",
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <strong style={{ fontSize: 16 }}>#{order.id.slice(-6).toUpperCase()}</strong>
                          
                          {/* Payment method badge */}
                          {isMP ? (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                padding: "3px 8px",
                                borderRadius: 8,
                                background: "#E0F2FE",
                                color: "#0284C7",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <i className="fas fa-bolt"></i> Mercado Pago
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                padding: "3px 8px",
                                borderRadius: 8,
                                background: "#ECFDF5",
                                color: "#059669",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              💵 Efectivo
                            </span>
                          )}

                          {/* Status Badge */}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              padding: "2px 8px",
                              borderRadius: 10,
                              background: isPending ? "#FEF3C7" : isApproved ? "#D1FAE5" : "#FEE2E2",
                              color: isPending ? "#B45309" : isApproved ? "#047857" : "#B91C1C",
                            }}
                          >
                            {isPending ? "🟡 Pendiente de Cobro" : isApproved ? (isMP ? "🟢 Pago Acreditado" : "🟢 Cobrado & Entregado") : "🔴 Cancelado"}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--b1-color-text-muted)", marginTop: 4 }}>
                          {order.date} • {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "var(--adm-primary)" }}>
                          ${formatMoney(order.total)}
                        </div>
                      </div>
                    </div>

                    {/* Customer & Delivery Details */}
                    <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span><strong>👤 Cliente:</strong> {order.customerName}</span>
                        {order.customerPhone && (
                          <a
                            href={`https://wa.me/${order.customerPhone.replace(/[^\d]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#059669",
                              fontWeight: 700,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <i className="fab fa-whatsapp"></i> {order.customerPhone}
                          </a>
                        )}
                      </div>
                      <div>
                        <strong>📍 Modalidad:</strong>{" "}
                        {order.deliveryType === "envio" ? `Envío a domicilio (${order.customerAddress || "Sin dirección"})` : "Retiro en local"}
                      </div>
                    </div>

                    {/* Payment Info Card */}
                    {isMP && (
                      <div
                        style={{
                          background: "linear-gradient(135deg, rgba(0, 158, 227, 0.08) 0%, rgba(0, 158, 227, 0.02) 100%)",
                          border: "1px solid rgba(0, 158, 227, 0.3)",
                          borderRadius: 10,
                          padding: "10px 12px",
                          marginBottom: 12,
                          fontSize: 12,
                          color: "#0369A1",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <i className="fas fa-check-circle" style={{ fontSize: 16, color: "#0284C7" }}></i>
                        <span>El cliente abonó online por Mercado Pago. El dinero está acreditado en tu cuenta y la ganancia registrada en Finanzas.</span>
                      </div>
                    )}

                    {isCash && isPending && (
                      <div
                        style={{
                          background: "#FFFBEB",
                          border: "1.5px dashed #F59E0B",
                          borderRadius: 10,
                          padding: "10px 12px",
                          marginBottom: 12,
                          fontSize: 12,
                          color: "#92400E",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <i className="fas fa-hand-holding-usd" style={{ fontSize: 16, color: "#D97706" }}></i>
                        <span><strong>Cobro en Efectivo:</strong> Cobrar <strong>${formatMoney(order.total)}</strong> al cliente contra entrega o al retirar.</span>
                      </div>
                    )}

                    {/* Items List */}
                    <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 10, marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--b1-color-text-muted)", marginBottom: 6 }}>
                        PRODUCTOS DEL PEDIDO:
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {parseOrderItems(order.items).map((item: any, idx: number) => {
                          const qty = item.quantity || item.qty || 1;
                          const name = item.name || item.title || "Producto";
                          const price = item.price ? Number(item.price) * Number(qty) : 0;
                          return (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                              <span>
                                <strong>{qty}x</strong> {name}
                                {item.comment && (
                                  <span style={{ color: "var(--b1-color-text-muted)", fontStyle: "italic", marginLeft: 4 }}>
                                    ({item.comment})
                                  </span>
                                )}
                              </span>
                              <span style={{ fontWeight: 600 }}>${formatMoney(price)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Bar for Delivery & Operations */}
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      {/* 📋 Copy Order Details for Delivery Driver */}
                      <button
                        type="button"
                        onClick={() => handleCopyOrder(order)}
                        style={{
                          flex: 1,
                          minWidth: 150,
                          background: copiedOrderId === order.id ? "#ECFDF5" : "#F8FAFC",
                          color: copiedOrderId === order.id ? "#059669" : "#334155",
                          border: "1.5px solid " + (copiedOrderId === order.id ? "#10B981" : "#CBD5E1"),
                          borderRadius: 10,
                          padding: "9px 12px",
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <i className={copiedOrderId === order.id ? "fas fa-check-circle" : "fas fa-copy"}></i>
                        <span>{copiedOrderId === order.id ? "¡Copiado para Repartidor! ✅" : "📋 Copiar para Delivery"}</span>
                      </button>

                      {/* 📲 Quick Share on WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(order)}
                        title="Enviar detalle a WhatsApp"
                        style={{
                          background: "#25D366",
                          color: "#fff",
                          border: "none",
                          borderRadius: 10,
                          padding: "9px 12px",
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <i className="fab fa-whatsapp"></i>
                        <span>WhatsApp</span>
                      </button>
                    </div>

                    {/* Action Buttons for Cash Orders */}
                    {isCash && isPending && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                          type="button"
                          disabled={updatingOrderId === order.id}
                          onClick={() => handleUpdateOrderStatus(order.id, "aprobado")}
                          style={{
                            flex: 1,
                            background: "#059669",
                            color: "#fff",
                            border: "none",
                            borderRadius: 10,
                            padding: "10px 14px",
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <i className="fas fa-check-circle"></i>
                          <span>{updatingOrderId === order.id ? "Guardando..." : "✅ Confirmar Cobro & Entrega"}</span>
                        </button>

                        <button
                          type="button"
                          disabled={updatingOrderId === order.id}
                          onClick={() => {
                            if (confirm("¿Cancelar este pedido? El stock de los insumos será devuelto automáticamente al inventario.")) {
                              handleUpdateOrderStatus(order.id, "rechazado");
                            }
                          }}
                          style={{
                            background: "#FEE2E2",
                            color: "#DC2626",
                            border: "1px solid #FCA5A5",
                            borderRadius: 10,
                            padding: "10px 14px",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          ❌ Cancelar
                        </button>
                      </div>
                    )}

                    {isApproved && (
                      <div style={{ color: "#059669", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
                        <i className="fas fa-check-double"></i> Venta confirmada y registrada en Finanzas
                      </div>
                    )}

                    {isRejected && (
                      <div style={{ color: "#DC2626", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
                        <i className="fas fa-times-circle"></i> Pedido cancelado (Insumos reestablecidos)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           TAB 1: STOCK DE INSUMOS
           ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "stock" && (
        <div>
          {/* Metrics Grid */}
          <section className="adm-metrics-grid" style={{ padding: "14px 0 0" }}>
            <div
              className="adm-metric-card total"
              style={stockStatusFilter === "all" ? { borderColor: "var(--adm-primary)", background: "var(--adm-primary-light)" } : undefined}
              onClick={() => setStockStatusFilter("all")}
            >
              <div className="adm-metric-val">{stats.total}</div>
              <div className="adm-metric-label">Total</div>
            </div>

            <div
              className="adm-metric-card normal"
              style={stockStatusFilter === "normal" ? { borderColor: "var(--adm-success)", background: "var(--adm-success-light)" } : undefined}
              onClick={() => setStockStatusFilter("normal")}
            >
              <div className="adm-metric-val">{stats.inStock}</div>
              <div className="adm-metric-label">Óptimo</div>
            </div>

            <div
              className="adm-metric-card low"
              style={stockStatusFilter === "low" ? { borderColor: "var(--adm-warning)", background: "var(--adm-warning-light)" } : undefined}
              onClick={() => setStockStatusFilter("low")}
            >
              <div className="adm-metric-val">{stats.lowStock}</div>
              <div className="adm-metric-label">Poco</div>
            </div>

            <div
              className="adm-metric-card out"
              style={stockStatusFilter === "out" ? { borderColor: "var(--adm-danger)", background: "var(--adm-danger-light)" } : undefined}
              onClick={() => setStockStatusFilter("out")}
            >
              <div className="adm-metric-val">{stats.outOfStock}</div>
              <div className="adm-metric-label">Agotado</div>
            </div>
          </section>

          {/* Search & Category Pills */}
          <section className="adm-controls-section">
            <div className="adm-search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Buscar insumo o código de barras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="adm-modal-close"
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 26, height: 26 }}
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="adm-filter-pills">
              <button
                type="button"
                className={`adm-pill ${selectedCategory === "all" ? "active" : ""}`}
                onClick={() => setSelectedCategory("all")}
              >
                Todos ({inventory.length})
              </button>
              {categoriesList.map((cat) => {
                const count = inventory.filter((i) => i.category === cat).length;
                return (
                  <button
                    type="button"
                    key={cat}
                    className={`adm-pill ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </section>

          {/* Inventory Items List */}
          <main className="adm-inventory-list" style={{ padding: "4px 0 24px" }}>
            {loading ? (
              <div className="adm-empty-state">
                <i className="fas fa-spinner fa-spin" style={{ fontSize: 22, marginBottom: 8, display: "block" }}></i>
                Cargando stock...
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="adm-empty-state">No se encontraron insumos.</div>
            ) : (
              filteredInventory.map((item) => {
                const minThreshold = item.minAlert !== undefined ? item.minAlert : 15;
                const isOutOfStock = item.stock <= 0;
                const isLowStock = !isOutOfStock && item.stock < minThreshold;
                const statusClass = isOutOfStock ? "status-out" : isLowStock ? "status-low" : "";
                const badgeClass = isOutOfStock ? "out" : isLowStock ? "low" : "normal";
                const badgeLabel = isOutOfStock ? "Agotado" : isLowStock ? "Poco Stock" : "En Stock";

                return (
                  <div key={item.id} className={`adm-card ${statusClass}`}>
                    <div className="adm-card-top">
                      <div className="adm-card-info-left">
                        <div className="adm-card-icon">{item.icon || "📦"}</div>
                        <div className="adm-card-details">
                          <div className="adm-card-title">{item.name}</div>
                          <div className="adm-card-cat">
                            {item.category || "Insumo"}
                            {item.source === "sheets" && (
                              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: "var(--adm-success)" }}>
                                <i className="fas fa-table"></i> Sheets
                              </span>
                            )}
                            {item.barcode && (
                              <span style={{ marginLeft: 6, fontFamily: "monospace", fontSize: 10, background: "var(--adm-surface-subtle)", padding: "1px 5px", borderRadius: 4 }}>
                                #{item.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`adm-badge ${badgeClass}`}>{badgeLabel}</span>
                    </div>

                    <div className="adm-card-middle">
                      <div className="adm-stock-display">
                        <span className="adm-stock-num">{item.stock}</span>
                        <span className="adm-stock-unit">{item.unit || "u."}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          type="button"
                          className="adm-stepper-btn minus"
                          disabled={item.stock <= 0}
                          onClick={() => handleQuickDelta(item.id, -1)}
                          title="-1 unidad"
                          style={item.stock <= 0 ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                        >
                          −
                        </button>
                        <button
                          type="button"
                          className="adm-stepper-btn plus"
                          onClick={() => handleQuickDelta(item.id, 1)}
                          title="+1 unidad"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="adm-card-bottom-actions">
                      <button
                        type="button"
                        className="adm-quick-btn"
                        onClick={() => handleQuickDelta(item.id, 5)}
                        title="+5 unidades"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        className="adm-quick-btn"
                        onClick={() => {
                          setSelectedItemForLot(item);
                          setIsAddLotOpen(true);
                        }}
                      >
                        <i className="fas fa-layer-group"></i> + Lote
                      </button>
                      <button
                        type="button"
                        className="adm-btn-sm-primary"
                        onClick={() => {
                          setPublishItem(item);
                          setIsPublishModalOpen(true);
                        }}
                      >
                        <i className="fas fa-utensils"></i> Publicar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </main>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           TAB 2: FINANZAS & CAJA
           ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "finance" && (
        <div>
          {/* Period switch + quick entry */}
          <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "14px 0 0", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {(["today", "week", "month", "all"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  className={`adm-fin-pill ${financePeriod === p ? "active" : ""}`}
                  onClick={() => setFinancePeriod(p)}
                >
                  {p === "today" ? "Hoy" : p === "week" ? "7d" : p === "month" ? "30d" : "Todo"}
                </button>
              ))}
            </div>

            <div className="adm-actions-row">
              <button type="button" className="adm-btn-sm-success" onClick={() => setIsManualSaleOpen(true)}>
                <i className="fas fa-plus"></i> Venta
              </button>
              <button type="button" className="adm-btn-sm-danger" onClick={() => setIsManualExpenseOpen(true)}>
                <i className="fas fa-minus"></i> Gasto
              </button>
            </div>
          </section>

          {/* Finance Metrics */}
          <section className="adm-metrics-grid cols-3" style={{ padding: "14px 0 0" }}>
            <div className="adm-metric-card normal">
              <div className="adm-metric-label" style={{ marginBottom: 4 }}>Ingresos</div>
              <div className="adm-metric-val" style={{ color: "var(--adm-success)", fontSize: 15 }}>
                ${formatMoney(totalIncome)}
              </div>
              <div className="adm-metric-label" style={{ marginTop: 2 }}>{filteredSales.length} v.</div>
            </div>

            <div className="adm-metric-card out">
              <div className="adm-metric-label" style={{ marginBottom: 4 }}>Gastos</div>
              <div className="adm-metric-val" style={{ color: "var(--adm-danger)", fontSize: 15 }}>
                ${formatMoney(totalExpense)}
              </div>
              <div className="adm-metric-label" style={{ marginTop: 2 }}>{filteredExpenses.length} e.</div>
            </div>

            <div className="adm-metric-card">
              <div className="adm-metric-label" style={{ marginBottom: 4 }}>Balance</div>
              <div className="adm-metric-val" style={{ color: netBalance >= 0 ? "var(--adm-text-main)" : "var(--adm-danger)", fontSize: 15 }}>
                ${formatMoney(netBalance)}
              </div>
              <div className="adm-metric-label" style={{ marginTop: 2 }}>Neto</div>
            </div>
          </section>

          {/* Sales & Expenses Lists */}
          <section style={{ padding: "16px 0 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--adm-text-main)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="fas fa-arrow-down" style={{ color: "var(--adm-success)" }}></i> Ventas
                </h4>
                <span style={{ fontSize: 11, color: "var(--adm-text-muted)", fontWeight: 700 }}>{filteredSales.length} registros</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredSales.length === 0 ? (
                  <div className="adm-empty-state">No hay ventas registradas.</div>
                ) : (
                  filteredSales.map((s) => (
                    <div key={s.id} className="adm-card adm-fin-expense-row">
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--adm-text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.description || (s.items && s.items.length > 0 ? s.items.map((i) => i.name).join(", ") : "Venta")}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--adm-text-subtle)" }}>
                          {s.date} • {s.paymentMethod || "mostrador"}
                        </div>
                      </div>
                      <span className="adm-fin-income-amount">+${formatMoney(s.total)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--adm-text-main)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="fas fa-arrow-up" style={{ color: "var(--adm-danger)" }}></i> Gastos
                </h4>
                <span style={{ fontSize: 11, color: "var(--adm-text-muted)", fontWeight: 700 }}>{filteredExpenses.length} registros</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredExpenses.length === 0 ? (
                  <div className="adm-empty-state">No hay gastos registrados.</div>
                ) : (
                  filteredExpenses.map((e) => (
                    <div key={e.id} className="adm-card adm-fin-expense-row">
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--adm-text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {e.description}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--adm-text-subtle)" }}>
                          {e.date} • {e.category}
                        </div>
                      </div>
                      <span className="adm-fin-expense-amount">-${formatMoney(e.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           MODAL: AGREGAR LOTE A INSUMO
           ══════════════════════════════════════════════════════════════════ */}
      {isAddLotOpen && selectedItemForLot && (
        <div className="b1-modal-backdrop" onClick={() => setIsAddLotOpen(false)}>
          <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="adm-modal-header">
              <span className="adm-modal-title">Lote: {selectedItemForLot.name}</span>
              <button type="button" className="adm-modal-close" onClick={() => setIsAddLotOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddLotSubmit}>
              <div className="adm-modal-body">
                <div className="adm-form-group">
                  <label className="adm-form-label">Cantidad *</label>
                  <input
                    type="number"
                    min="1"
                    className="adm-input"
                    required
                    value={lotQty}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setLotQty(e.target.value)}
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">Vencimiento</label>
                  <input
                    type="date"
                    className="adm-input"
                    value={lotExpDate}
                    onChange={(e) => setLotExpDate(e.target.value)}
                  />
                </div>

                <div className="adm-form-group" style={{ marginBottom: 0 }}>
                  <label className="adm-form-label">Costo ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    className="adm-input"
                    value={lotCost}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setLotCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn-cancel" onClick={() => setIsAddLotOpen(false)}>Cancelar</button>
                <button type="submit" className="adm-btn-submit">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           MODAL: CREAR NUEVO INSUMO
           ══════════════════════════════════════════════════════════════════ */}
      {isCreateItemOpen && (
        <div className="b1-modal-backdrop" onClick={() => setIsCreateItemOpen(false)}>
          <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="adm-modal-header">
              <span className="adm-modal-title">Alta de Insumo de Stock</span>
              <button type="button" className="adm-modal-close" onClick={() => setIsCreateItemOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateItemSubmit}>
              <div className="adm-modal-body">
                <div className="adm-form-group">
                  <label className="adm-form-label">Nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej: Carne Vacuna"
                    className="adm-input"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Categoría</label>
                    <input
                      type="text"
                      placeholder="Carnes..."
                      className="adm-input"
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Unidad</label>
                    <input
                      type="text"
                      placeholder="unidades, gr"
                      className="adm-input"
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
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
                    value={newItemBarcode}
                    onChange={(e) => setNewItemBarcode(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Stock</label>
                    <input
                      type="number"
                      className="adm-input"
                      value={newItemQty}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setNewItemQty(e.target.value)}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Mínimo</label>
                    <input
                      type="number"
                      className="adm-input"
                      value={newItemMinAlert}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setNewItemMinAlert(e.target.value)}
                    />
                  </div>
                  <div className="adm-form-group" style={{ marginBottom: 0 }}>
                    <label className="adm-form-label">Costo</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="adm-input"
                      value={newItemCost}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setNewItemCost(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn-cancel" onClick={() => setIsCreateItemOpen(false)}>Cancelar</button>
                <button type="submit" className="adm-btn-submit">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           MODAL: PUBLICAR EN CARTA
           ══════════════════════════════════════════════════════════════════ */}
      {isPublishModalOpen && publishItem && (
        <div className="b1-modal-backdrop" onClick={() => setIsPublishModalOpen(false)}>
          <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="adm-modal-header">
              <span className="adm-modal-title">Publicar: {publishItem.name}</span>
              <button type="button" className="adm-modal-close" onClick={() => setIsPublishModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handlePublishSubmit}>
              <div className="adm-modal-body">
                <p style={{ color: "var(--adm-text-muted)", margin: "0 0 14px", fontSize: 13, lineHeight: 1.4 }}>
                  Este insumo se agregará a la carta pública de clientes.
                </p>
                <div className="adm-form-group" style={{ marginBottom: 0 }}>
                  <label className="adm-form-label">Precio de venta ($) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej: 2500"
                    className="adm-input"
                    style={{ fontSize: 16, fontWeight: 800, color: "var(--adm-primary)" }}
                    required
                    value={publishPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPublishPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn-cancel" onClick={() => setIsPublishModalOpen(false)}>Cancelar</button>
                <button type="submit" className="adm-btn-submit">Publicar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           MODAL: VENTA MANUAL DE MOSTRADOR
           ══════════════════════════════════════════════════════════════════ */}
      {isManualSaleOpen && (
        <div className="b1-modal-backdrop" onClick={() => setIsManualSaleOpen(false)}>
          <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="adm-modal-header">
              <span className="adm-modal-title">Venta Mostrador</span>
              <button type="button" className="adm-modal-close" onClick={() => setIsManualSaleOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleManualSaleSubmit}>
              <div className="adm-modal-body">
                <div className="adm-form-group">
                  <label className="adm-form-label">Monto ($) *</label>
                  <input
                    type="number"
                    step="any"
                    className="adm-input"
                    style={{ fontWeight: 800, fontSize: 16, color: "var(--adm-success)" }}
                    required
                    placeholder="8500"
                    value={manualSaleAmount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setManualSaleAmount(e.target.value)}
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">Descripción</label>
                  <input
                    type="text"
                    className="adm-input"
                    value={manualSaleDesc}
                    onChange={(e) => setManualSaleDesc(e.target.value)}
                  />
                </div>

                <div className="adm-form-group" style={{ marginBottom: 0 }}>
                  <label className="adm-form-label">Medio de pago</label>
                  <select
                    className="adm-input"
                    value={manualSaleMethod}
                    onChange={(e) => setManualSaleMethod(e.target.value)}
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
                <button type="button" className="adm-btn-cancel" onClick={() => setIsManualSaleOpen(false)}>Cancelar</button>
                <button type="submit" className="adm-btn-submit success">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           MODAL: REGISTRAR GASTO MANUAL
           ══════════════════════════════════════════════════════════════════ */}
      {isManualExpenseOpen && (
        <div className="b1-modal-backdrop" onClick={() => setIsManualExpenseOpen(false)}>
          <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="adm-modal-header">
              <span className="adm-modal-title">Registrar Gasto</span>
              <button type="button" className="adm-modal-close" onClick={() => setIsManualExpenseOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleManualExpenseSubmit}>
              <div className="adm-modal-body">
                <div className="adm-form-group">
                  <label className="adm-form-label">Descripción *</label>
                  <input
                    type="text"
                    placeholder="Ej: Bolsas, flete..."
                    className="adm-input"
                    required
                    value={manualExpenseDesc}
                    onChange={(e) => setManualExpenseDesc(e.target.value)}
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
                    value={manualExpenseAmount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setManualExpenseAmount(e.target.value)}
                  />
                </div>

                <div className="adm-form-group" style={{ marginBottom: 0 }}>
                  <label className="adm-form-label">Categoría</label>
                  <select
                    className="adm-input"
                    value={manualExpenseCategory}
                    onChange={(e) => setManualExpenseCategory(e.target.value)}
                  >
                    <option value="general">Gastos Generales</option>
                    <option value="stock">Insumos</option>
                    <option value="servicios">Servicios</option>
                    <option value="sueldos">Sueldos</option>
                  </select>
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn-cancel" onClick={() => setIsManualExpenseOpen(false)}>Cancelar</button>
                <button type="submit" className="adm-btn-submit danger">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VER COMPROBANTE EN PANTALLA COMPLETA ────────────────────── */}
      {selectedReceiptImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setSelectedReceiptImage(null)}
        >
          <div style={{ width: "100%", maxWidth: 600, textAlign: "right", marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setSelectedReceiptImage(null)}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 38,
                height: 38,
                fontSize: 20,
                cursor: "pointer",
              }}
            >
              &times;
            </button>
          </div>
          <img
            src={selectedReceiptImage}
            alt="Comprobante de Transferencia"
            style={{
              maxWidth: "100%",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: 10,
              boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
