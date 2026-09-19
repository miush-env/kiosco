"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Bell } from "lucide-react";
import { formatMoney } from "@/types/panel";

// Custom Hooks
import { usePanelOrders } from "@/hooks/panel/usePanelOrders";
import { usePanelStock } from "@/hooks/panel/usePanelStock";
import { usePanelFinance } from "@/hooks/panel/usePanelFinance";

// Modular Panel Components
import PanelActionBar from "@/components/panel/common/PanelActionBar";
import OrdersTab from "@/components/panel/orders/OrdersTab";
import StockTab from "@/components/panel/stock/StockTab";
import FinanceTab from "@/components/panel/finance/FinanceTab";

export default function AdminStockAndFinancePage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");

  const [activeTab, setActiveTab] = useState<"orders" | "stock" | "finance">("orders");

  useEffect(() => {
    if (tabParam === "stock" || tabParam === "finance" || tabParam === "orders") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Stock hook
  const stock = usePanelStock();

  // Finance hook
  const finance = usePanelFinance();

  // Orders hook (callback to refresh finance/stock when an order status changes)
  const orders = usePanelOrders(() => {
    finance.fetchFinanceData();
    stock.fetchStockData();
  });

  return (
    <div style={{ padding: "14px 18px 24px", position: "relative", minHeight: "100%", overflowX: "clip" }}>
      {/* ── BACKGROUND AMBIENT GLOW & MULTI-GEOMETRIC ACCENTS ─────────── */}
      <div className="b1-panel-bg-decor" aria-hidden="true">
        <div className="b1-geom-hexagon"></div>
        <div className="b1-geom-diamond"></div>
        <div className="b1-geom-star"></div>
        <div className="b1-geom-triangle"></div>
        <div className="b1-geom-octagon"></div>
        <div className="b1-geom-ribbon"></div>
        <div className="b1-geom-ring"></div>
        <div className="b1-panel-orb-1"></div>
        <div className="b1-panel-orb-2"></div>
        <div className="b1-panel-orb-3"></div>
      </div>

      {/* ── FOREGROUND CONTENT ─────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── REAL-TIME NEW ORDER TOAST ALERT ─────────────────────────────── */}
        {orders.newOrderToast && (
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
                  {orders.newOrderToast.paymentMethod === "mercadopago" ? "Mercado Pago" : "Efectivo"}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                #{orders.newOrderToast.id.slice(-6).toUpperCase()} • {orders.newOrderToast.customerName} • ${formatMoney(orders.newOrderToast.total)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                orders.setNewOrderToast(null);
                setActiveTab("orders");
              }}
              style={{
                background: "#10B981",
                color: "#fff",
                border: "none",
                padding: "6px 12px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Ver
            </button>
            <button
              type="button"
              onClick={() => orders.setNewOrderToast(null)}
              style={{
                background: "transparent",
                color: "#94A3B8",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                padding: 4,
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          </div>
        )}

        {/* ── TOP ACTIONS BAR ───────────────────────────────────────────── */}
        <PanelActionBar
          activeTab={activeTab}
          pendingOrdersCount={orders.pendingOrdersCount}
          soundEnabled={orders.soundEnabled}
          setSoundEnabled={orders.setSoundEnabled}
          onRefreshOrders={orders.fetchOrders}
          onClearOrders={orders.handleClearAllOrders}
          onOpenCreateItem={() => stock.setIsCreateItemOpen(true)}
        />

        {/* ── TAB 1: GESTIÓN DE PEDIDOS ─────────────────────────────────── */}
        {activeTab === "orders" && (
          <OrdersTab
            orders={orders.orders}
            filteredOrders={orders.filteredOrders}
            orderFilter={orders.orderFilter}
            setOrderFilter={orders.setOrderFilter}
            orderStats={orders.orderStats}
            updatingOrderId={orders.updatingOrderId}
            copiedOrderId={orders.copiedOrderId}
            selectedReceiptImage={orders.selectedReceiptImage}
            setSelectedReceiptImage={orders.setSelectedReceiptImage}
            notificationPermission={orders.notificationPermission}
            onRequestNotificationPermission={orders.requestNotificationPermission}
            onUpdateStatus={orders.handleUpdateOrderStatus}
            onCopyPhone={orders.handleCopyPhone}
            onShareWhatsApp={orders.handleShareWhatsApp}
          />
        )}

        {/* ── TAB 2: STOCK DE INSUMOS ───────────────────────────────────── */}
        {activeTab === "stock" && (
          <StockTab
            inventory={stock.inventory}
            filteredInventory={stock.filteredInventory}
            stats={stock.stats}
            loading={stock.loading}
            searchQuery={stock.searchQuery}
            setSearchQuery={stock.setSearchQuery}
            selectedCategory={stock.selectedCategory}
            setSelectedCategory={stock.setSelectedCategory}
            stockStatusFilter={stock.stockStatusFilter}
            setStockStatusFilter={stock.setStockStatusFilter}
            categoriesList={stock.categoriesList}
            onQuickDelta={stock.handleQuickDelta}
            isAddLotOpen={stock.isAddLotOpen}
            setIsAddLotOpen={stock.setIsAddLotOpen}
            selectedItemForLot={stock.selectedItemForLot}
            setSelectedItemForLot={stock.setSelectedItemForLot}
            lotQty={stock.lotQty}
            setLotQty={stock.setLotQty}
            lotExpDate={stock.lotExpDate}
            setLotExpDate={stock.setLotExpDate}
            lotCost={stock.lotCost}
            setLotCost={stock.setLotCost}
            onAddLotSubmit={stock.handleAddLotSubmit}
            isCreateItemOpen={stock.isCreateItemOpen}
            setIsCreateItemOpen={stock.setIsCreateItemOpen}
            newItemName={stock.newItemName}
            setNewItemName={stock.setNewItemName}
            newItemCategory={stock.newItemCategory}
            setNewItemCategory={stock.setNewItemCategory}
            newItemUnit={stock.newItemUnit}
            setNewItemUnit={stock.setNewItemUnit}
            newItemBarcode={stock.newItemBarcode}
            setNewItemBarcode={stock.setNewItemBarcode}
            newItemMinAlert={stock.newItemMinAlert}
            setNewItemMinAlert={stock.setNewItemMinAlert}
            newItemQty={stock.newItemQty}
            setNewItemQty={stock.setNewItemQty}
            newItemCost={stock.newItemCost}
            setNewItemCost={stock.setNewItemCost}
            onCreateItemSubmit={stock.handleCreateItemSubmit}
            isPublishModalOpen={stock.isPublishModalOpen}
            setIsPublishModalOpen={stock.setIsPublishModalOpen}
            publishItem={stock.publishItem}
            setPublishItem={stock.setPublishItem}
            publishPrice={stock.publishPrice}
            setPublishPrice={stock.setPublishPrice}
            onPublishSubmit={stock.handlePublishSubmit}
          />
        )}

        {/* ── TAB 3: CAJA Y FINANZAS ────────────────────────────────────── */}
        {activeTab === "finance" && (
          <FinanceTab
            sales={finance.sales}
            expenses={finance.expenses}
            financePeriod={finance.financePeriod}
            setFinancePeriod={finance.setFinancePeriod}
            filteredSales={finance.filteredSales}
            filteredExpenses={finance.filteredExpenses}
            totalIncome={finance.totalIncome}
            totalExpense={finance.totalExpense}
            netBalance={finance.netBalance}
            isManualSaleOpen={finance.isManualSaleOpen}
            setIsManualSaleOpen={finance.setIsManualSaleOpen}
            manualSaleAmount={finance.manualSaleAmount}
            setManualSaleAmount={finance.setManualSaleAmount}
            manualSaleDesc={finance.manualSaleDesc}
            setManualSaleDesc={finance.setManualSaleDesc}
            manualSaleMethod={finance.manualSaleMethod}
            setManualSaleMethod={finance.setManualSaleMethod}
            onManualSaleSubmit={finance.handleManualSaleSubmit}
            isManualExpenseOpen={finance.isManualExpenseOpen}
            setIsManualExpenseOpen={finance.setIsManualExpenseOpen}
            manualExpenseAmount={finance.manualExpenseAmount}
            setManualExpenseAmount={finance.setManualExpenseAmount}
            manualExpenseDesc={finance.manualExpenseDesc}
            setManualExpenseDesc={finance.setManualExpenseDesc}
            manualExpenseCategory={finance.manualExpenseCategory}
            setManualExpenseCategory={finance.setManualExpenseCategory}
            onManualExpenseSubmit={finance.handleManualExpenseSubmit}
          />
        )}
      </div>
    </div>
  );
}
