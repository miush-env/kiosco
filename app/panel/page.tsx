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
  MessageCircle,
  X,
  Phone,
  MapPin,
  Store,
  CheckCheck,
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
                const isPickup = order.deliveryType === "retiro";
                const shortId = order.id.slice(-6).toUpperCase();
                const itemsList = parseOrderItems(order.items);
                const timeString = order.createdAt
                  ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "";

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden transition-all"
                  >
                    {/* 1. Header de la Orden */}
                    <div className="p-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-gray-900 text-sm tracking-wide">
                          #{shortId}
                        </span>

                        {/* Payment badge: only show for delivery orders */}
                        {!isPickup ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              isCash
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                : "bg-sky-50 text-sky-700 border-sky-200/60"
                            }`}
                          >
                            {isCash ? "Efectivo" : "Mercado Pago"}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-amber-50 text-amber-800 border-amber-200/60 flex items-center gap-1">
                            <Store className="w-3 h-3 text-amber-600" />
                            <span>Retiro en local</span>
                          </span>
                        )}

                        {isPending && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                            {isPickup ? "Pendiente de retiro" : "Pendiente de cobro"}
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                            {isPickup ? "Entregado en local" : isMP ? "Pago Acreditado" : "Cobrado & Entregado"}
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200/60">
                            Cancelado
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">
                          ${formatMoney(order.total)}
                        </span>
                        <span className="block text-[11px] text-gray-400 font-medium">
                          {order.date} {timeString ? `• ${timeString}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* 2. Información de Cliente y Modalidad */}
                    <div className="p-4 py-3 bg-gray-50/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-gray-700">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="text-gray-400">Cliente:</span>
                          <span className="font-bold text-gray-900">{order.customerName}</span>
                        </div>
                        {order.customerPhone && (
                          <a
                            href={`https://wa.me/549${order.customerPhone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer no-underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{order.customerPhone}</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-gray-700">
                        {isPickup ? (
                          <div className="flex items-center gap-1.5 text-gray-800 font-medium flex-wrap">
                            <Store className="w-3.5 h-3.5 text-orange-500" />
                            <span>Modalidad: <strong>Retiro en el local</strong></span>
                            {order.transferRef && (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold text-xs">
                                Código: #{order.transferRef}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-800 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-orange-500" />
                            <span>Envío a: <strong>{order.customerAddress || "Sin dirección"}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Lista de Productos */}
                    <div className="p-4 py-3 border-t border-gray-100">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Productos del pedido
                      </span>
                      <div className="space-y-1 text-xs text-gray-800">
                        {itemsList.map((item: any, idx: number) => {
                          const qty = item.quantity || item.qty || 1;
                          const name = item.name || item.title || "Producto";
                          const price = item.price ? Number(item.price) * Number(qty) : 0;
                          return (
                            <div key={idx} className="flex justify-between items-center py-0.5">
                              <span>
                                <strong className="font-bold text-gray-900">{qty}x</strong> {name}
                                {item.comment && (
                                  <span className="text-gray-400 italic ml-1">
                                    ({item.comment})
                                  </span>
                                )}
                              </span>
                              <span className="font-semibold text-gray-700">
                                ${formatMoney(price)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. Botonera de Acciones con Jerarquía Clara */}
                    <div className="p-3 bg-gray-50/70 border-t border-gray-100 space-y-2">
                      {/* Acciones Secundarias */}
                      <div className="grid grid-cols-2 gap-2">
                        {!isPickup ? (
                          <button
                            type="button"
                            onClick={() => handleCopyOrder(order)}
                            className="py-2 px-3 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          >
                            {copiedOrderId === order.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-gray-500" />
                                <span>Copiar Delivery</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="hidden" />
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (order.customerPhone) {
                              const cleanPhone = order.customerPhone.replace(/\D/g, "");
                              window.open(`https://wa.me/549${cleanPhone}`, "_blank");
                            } else {
                              handleShareWhatsApp(order);
                            }
                          }}
                          className={`${
                            isPickup ? "col-span-2" : "col-span-1"
                          } py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 text-emerald-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Chat WhatsApp</span>
                        </button>
                      </div>

                      {/* Acciones Primarias */}
                      {isPending && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={updatingOrderId === order.id}
                            onClick={() => {
                              if (confirm("¿Cancelar este pedido? El stock de los insumos será devuelto automáticamente al inventario.")) {
                                handleUpdateOrderStatus(order.id, "rechazado");
                              }
                            }}
                            className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition-colors border border-rose-200/50 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancelar</span>
                          </button>

                          <button
                            type="button"
                            disabled={updatingOrderId === order.id}
                            onClick={() => handleUpdateOrderStatus(order.id, "aprobado")}
                            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>{updatingOrderId === order.id ? "Guardando..." : isPickup ? "Confirmar Entrega" : "Confirmar Cobro y Entrega"}</span>
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold pt-1">
                          <CheckCheck className="w-4 h-4 text-emerald-600" />
                          <span>Venta confirmada y registrada en Finanzas</span>
                        </div>
                      )}

                      {isRejected && (
                        <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold pt-1">
                          <X className="w-4 h-4 text-rose-500" />
                          <span>Pedido cancelado (Insumos reestablecidos)</span>
                        </div>
                      )}
                    </div>
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
              <div
                style={{
                  textAlign: "center",
                  padding: "36px 20px",
                  background: "var(--b1-color-surface, #fff)",
                  borderRadius: "var(--b1-radius-lg, 16px)",
                  border: "1px solid var(--b1-color-border, #E2E8F0)",
                }}
              >
                <Package style={{ width: 36, height: 36, color: "var(--b1-color-text-muted, #94A3B8)", margin: "0 auto 10px" }} />
                <strong style={{ display: "block", color: "var(--b1-color-text-main, #0F172A)", fontSize: 14, marginBottom: 4 }}>
                  No se encontraron insumos
                </strong>
                <p style={{ fontSize: 12, color: "var(--b1-color-text-muted, #64748B)", margin: "0 auto 14px", maxWidth: 320 }}>
                  Probá ajustando la búsqueda o seleccionando otra categoría.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setStockStatusFilter("all");
                  }}
                  className="adm-btn-sm-primary"
                  style={{
                    margin: "0 auto",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <RefreshCw style={{ width: 13, height: 13 }} />
                  <span>Limpiar filtros / Ver todos</span>
                </button>
              </div>
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
                  {p === "today" ? "Hoy" : p === "week" ? "Esta Semana" : p === "month" ? "Este Mes" : "Todo"}
                </button>
              ))}
            </div>

            <div className="adm-actions-row" style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="adm-btn-sm-primary"
                onClick={() => setIsManualSaleOpen(true)}
                style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                <Plus style={{ width: 13, height: 13 }} />
                <span>Venta</span>
              </button>
              <button
                type="button"
                className="adm-btn-sm-primary"
                onClick={() => setIsManualExpenseOpen(true)}
                style={{ fontSize: 12, background: "var(--adm-surface-subtle, #F1F5F9)", color: "var(--adm-danger, #EF4444)", border: "1px solid var(--b1-color-border, #E2E8F0)", display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                <span>− Gasto</span>
              </button>
            </div>
          </section>

          {/* Metrics Overview 3-grid */}
          <section className="adm-metrics-grid" style={{ marginTop: 12 }}>
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
          <section style={{ padding: "16px 0 24px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--adm-text-main)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="fas fa-arrow-down" style={{ color: "var(--adm-success)" }}></i> Ventas & Pedidos
                </h4>
                <span style={{ fontSize: 11, color: "var(--adm-text-muted)", fontWeight: 700 }}>{filteredSales.length} registros</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredSales.length === 0 ? (
                  <div className="adm-empty-state" style={{ padding: "20px 14px", fontSize: 12 }}>
                    No hay ventas registradas en este período.
                  </div>
                ) : (
                  filteredSales.map((s) => {
                    let customerName = "Venta Mostrador";
                    let statusText = "Aprobado";
                    let shortCode = "";

                    if (s.description) {
                      const match = s.description.match(/Pedido\s+([^\s-]+)\s*-\s*([^(]+)(?:\(([^)]+)\))?/i);
                      if (match) {
                        const rawId = match[1];
                        shortCode = rawId.includes("_")
                          ? "#" + rawId.split("_").pop()?.substring(0, 6).toUpperCase()
                          : "#" + rawId.slice(-6).toUpperCase();
                        customerName = match[2].trim();
                        if (match[3]) statusText = match[3].trim();
                      } else {
                        customerName = s.description;
                      }
                    } else if (s.items && s.items.length > 0) {
                      customerName = s.items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
                    }

                    if (!shortCode && s.id) {
                      shortCode = s.id.includes("_")
                        ? "#" + s.id.split("_").pop()?.substring(0, 6).toUpperCase()
                        : "#" + s.id.slice(-6).toUpperCase();
                    }

                    const isCancelled =
                      statusText.toLowerCase().includes("cancelado") ||
                      statusText.toLowerCase().includes("rechazado");

                    return (
                      <div
                        key={s.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          background: "var(--b1-color-surface, #fff)",
                          border: "1px solid var(--b1-color-border, #E2E8F0)",
                          borderRadius: 14,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--adm-text-main, #0F172A)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {customerName}
                            </span>
                            <span
                              style={{
                                padding: "2px 7px",
                                borderRadius: 10,
                                fontSize: 10,
                                fontWeight: 800,
                                background: isCancelled ? "#FEE2E2" : "#ECFDF5",
                                color: isCancelled ? "#DC2626" : "#059669",
                                border: `1px solid ${isCancelled ? "#FECACA" : "#A7F3D0"}`,
                              }}
                            >
                              {statusText}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 11,
                              color: "var(--adm-text-muted, #64748B)",
                              flexWrap: "wrap",
                            }}
                          >
                            {shortCode && (
                              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--adm-text-main, #0F172A)" }}>
                                {shortCode}
                              </span>
                            )}
                            {shortCode && <span>•</span>}
                            <span style={{ textTransform: "capitalize" }}>
                              {s.paymentMethod === "mercadopago"
                                ? "Mercado Pago"
                                : s.paymentMethod === "efectivo"
                                ? "Efectivo"
                                : s.paymentMethod || "Mostrador"}
                            </span>
                            <span>•</span>
                            <span>{s.date}</span>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: "var(--adm-success, #10B981)",
                            flexShrink: 0,
                          }}
                        >
                          +${formatMoney(s.total)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--adm-text-main)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="fas fa-arrow-up" style={{ color: "var(--adm-danger)" }}></i> Gastos Operativos
                </h4>
                <span style={{ fontSize: 11, color: "var(--adm-text-muted)", fontWeight: 700 }}>{filteredExpenses.length} registros</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredExpenses.length === 0 ? (
                  <div className="adm-empty-state" style={{ padding: "20px 14px", fontSize: 12 }}>
                    No hay gastos registrados en este período.
                  </div>
                ) : (
                  filteredExpenses.map((e) => (
                    <div
                      key={e.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        background: "var(--b1-color-surface, #fff)",
                        border: "1px solid var(--b1-color-border, #E2E8F0)",
                        borderRadius: 14,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--adm-text-main, #0F172A)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {e.description}
                          </span>
                          {e.category && (
                            <span
                              style={{
                                padding: "2px 7px",
                                borderRadius: 10,
                                fontSize: 10,
                                fontWeight: 700,
                                background: "var(--adm-surface-subtle, #F1F5F9)",
                                color: "var(--adm-text-muted, #64748B)",
                                border: "1px solid var(--b1-color-border, #E2E8F0)",
                              }}
                            >
                              {e.category}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--adm-text-muted, #64748B)" }}>
                          {e.date}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "var(--adm-danger, #EF4444)",
                          flexShrink: 0,
                        }}
                      >
                        -${formatMoney(e.amount)}
                      </span>
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
