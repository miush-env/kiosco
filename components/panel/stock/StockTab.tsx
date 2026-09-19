"use client";

import React from "react";
import { Package, RefreshCw } from "lucide-react";
import { InventoryItem, InventoryStats, StockStatusFilter } from "@/types/panel";
import StockItemCard from "./StockItemCard";
import CreateEditStockModal from "./CreateEditStockModal";
import AdjustStockModal from "./AdjustStockModal";
import PublishStockModal from "./PublishStockModal";

interface StockTabProps {
  inventory: InventoryItem[];
  filteredInventory: InventoryItem[];
  stats: InventoryStats;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  stockStatusFilter: StockStatusFilter;
  setStockStatusFilter: (s: StockStatusFilter) => void;
  categoriesList: string[];
  onQuickDelta: (id: string, delta: number) => void;
  // Modals state & handlers
  isAddLotOpen: boolean;
  setIsAddLotOpen: (open: boolean) => void;
  selectedItemForLot: InventoryItem | null;
  setSelectedItemForLot: (item: InventoryItem | null) => void;
  lotQty: string;
  setLotQty: (q: string) => void;
  lotExpDate: string;
  setLotExpDate: (d: string) => void;
  lotCost: string;
  setLotCost: (c: string) => void;
  onAddLotSubmit: (e: React.FormEvent) => void;

  isCreateItemOpen: boolean;
  setIsCreateItemOpen: (open: boolean) => void;
  newItemName: string;
  setNewItemName: (name: string) => void;
  newItemCategory: string;
  setNewItemCategory: (cat: string) => void;
  newItemUnit: string;
  setNewItemUnit: (unit: string) => void;
  newItemBarcode: string;
  setNewItemBarcode: (bc: string) => void;
  newItemMinAlert: string;
  setNewItemMinAlert: (min: string) => void;
  newItemQty: string;
  setNewItemQty: (qty: string) => void;
  newItemCost: string;
  setNewItemCost: (cost: string) => void;
  onCreateItemSubmit: (e: React.FormEvent) => void;

  isPublishModalOpen: boolean;
  setIsPublishModalOpen: (open: boolean) => void;
  publishItem: InventoryItem | null;
  setPublishItem: (item: InventoryItem | null) => void;
  publishPrice: string;
  setPublishPrice: (price: string) => void;
  onPublishSubmit: (e: React.FormEvent) => void;
}

export default function StockTab({
  inventory,
  filteredInventory,
  stats,
  loading,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  stockStatusFilter,
  setStockStatusFilter,
  categoriesList,
  onQuickDelta,
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
  onAddLotSubmit,
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
  onCreateItemSubmit,
  isPublishModalOpen,
  setIsPublishModalOpen,
  publishItem,
  setPublishItem,
  publishPrice,
  setPublishPrice,
  onPublishSubmit,
}: StockTabProps) {
  return (
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
          filteredInventory.map((item) => (
            <StockItemCard
              key={item.id}
              item={item}
              onQuickDelta={onQuickDelta}
              onOpenAddLot={(it) => {
                setSelectedItemForLot(it);
                setIsAddLotOpen(true);
              }}
              onOpenPublish={(it) => {
                setPublishItem(it);
                setIsPublishModalOpen(true);
              }}
            />
          ))
        )}
      </main>

      {/* Modals */}
      <CreateEditStockModal
        isOpen={isCreateItemOpen}
        onClose={() => setIsCreateItemOpen(false)}
        onSubmit={onCreateItemSubmit}
        name={newItemName}
        setName={setNewItemName}
        category={newItemCategory}
        setCategory={setNewItemCategory}
        unit={newItemUnit}
        setUnit={setNewItemUnit}
        barcode={newItemBarcode}
        setBarcode={setNewItemBarcode}
        minAlert={newItemMinAlert}
        setMinAlert={setNewItemMinAlert}
        qty={newItemQty}
        setQty={setNewItemQty}
        cost={newItemCost}
        setCost={setNewItemCost}
      />

      <AdjustStockModal
        isOpen={isAddLotOpen}
        onClose={() => setIsAddLotOpen(false)}
        selectedItem={selectedItemForLot}
        onSubmit={onAddLotSubmit}
        lotQty={lotQty}
        setLotQty={setLotQty}
        lotExpDate={lotExpDate}
        setLotExpDate={setLotExpDate}
        lotCost={lotCost}
        setLotCost={setLotCost}
      />

      <PublishStockModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        publishItem={publishItem}
        onSubmit={onPublishSubmit}
        publishPrice={publishPrice}
        setPublishPrice={setPublishPrice}
      />
    </div>
  );
}
