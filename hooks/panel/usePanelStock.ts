"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { InventoryItem, InventoryStats, StockStatusFilter } from "@/types/panel";

export function usePanelStock() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>("all");

  // Sync refs for debouncing
  const syncTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingStockUpdatesRef = useRef<Record<string, number>>({});

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

  // Fetch stock data
  const fetchStockData = useCallback(async () => {
    try {
      const invRes = await fetch("/api/inventory");
      const invData = await invRes.json();
      if (invData.success) {
        setInventory(invData.inventory || []);
        setStats(invData.stats || { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
      }
    } catch (e) {
      console.error("Error fetching stock data:", e);
    }
  }, []);

  // Filtered inventory list
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

  // Low stock alert items
  const lowStockAlertItems = useMemo(() => {
    return inventory.filter((item) => {
      const minThreshold = item.minAlert !== undefined ? item.minAlert : 15;
      return item.stock < minThreshold;
    });
  }, [inventory]);

  // Quick delta adjustment with instant optimistic UI + Debounced Server Sync
  const handleQuickDelta = useCallback((id: string, delta: number) => {
    const currentItem = inventory.find((i) => i.id === id);
    const baseStock =
      pendingStockUpdatesRef.current[id] !== undefined
        ? pendingStockUpdatesRef.current[id]
        : Number(currentItem?.stock || 0);

    const targetStock = Math.max(0, baseStock + delta);
    pendingStockUpdatesRef.current[id] = targetStock;

    // Instant optimistic UI update
    setInventory((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          return { ...item, stock: targetStock };
        }
        return item;
      });

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

    if (syncTimersRef.current[id]) {
      clearTimeout(syncTimersRef.current[id]);
    }

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
  }, [inventory]);

  // Create Insumo Submit
  const handleCreateItemSubmit = useCallback(async (e: React.FormEvent) => {
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
        fetchStockData();
        setIsCreateItemOpen(false);
        setNewItemName("");
        setNewItemBarcode("");
        setNewItemQty("0");
        setNewItemCost("");
      }
    } catch (err) {
      alert("Error al crear insumo");
    }
  }, [newItemName, newItemCategory, newItemUnit, newItemBarcode, newItemMinAlert, newItemQty, newItemCost, fetchStockData]);

  // Add Lot Submit
  const handleAddLotSubmit = useCallback(async (e: React.FormEvent) => {
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
        fetchStockData();
      }
    } catch (err) {
      alert("Error al agregar lote");
    }
  }, [selectedItemForLot, lotQty, lotExpDate, lotCost, fetchStockData]);

  // Publish to Menu
  const handlePublishSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [publishItem, publishPrice]);

  useEffect(() => {
    fetchStockData().finally(() => setLoading(false));
    return () => {
      Object.values(syncTimersRef.current).forEach((t) => clearTimeout(t));
    };
  }, [fetchStockData]);

  return {
    inventory,
    setInventory,
    stats,
    setStats,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    stockStatusFilter,
    setStockStatusFilter,
    filteredInventory,
    categoriesList,
    lowStockAlertItems,
    handleQuickDelta,
    handleCreateItemSubmit,
    handleAddLotSubmit,
    handlePublishSubmit,
    fetchStockData,
    // Modals
    isAddLotOpen,
    setIsAddLotOpen,
    selectedItemForLot,
    setSelectedItemForLot,
    lotQty,
    setLotQty,
    lotExpDate,
    setLotExpDate,
    lotCost,
    setLotCost,
    isCreateItemOpen,
    setIsCreateItemOpen,
    newItemName,
    setNewItemName,
    newItemCategory,
    setNewItemCategory,
    newItemUnit,
    setNewItemUnit,
    newItemBarcode,
    setNewItemBarcode,
    newItemMinAlert,
    setNewItemMinAlert,
    newItemQty,
    setNewItemQty,
    newItemCost,
    setNewItemCost,
    isPublishModalOpen,
    setIsPublishModalOpen,
    publishItem,
    setPublishItem,
    publishPrice,
    setPublishPrice,
  };
}
