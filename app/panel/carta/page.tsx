"use client";

import React from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useCartaManagement } from "@/hooks/panel/useCartaManagement";
import CartaProductList from "@/components/panel/carta/CartaProductList";
import ProductEditModal from "@/components/panel/carta/ProductEditModal";

export default function OwnerMenuManagementPage() {
  const { user, isLoaded } = useUser();
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;

  const carta = useCartaManagement();

  // Restrict access: Only Owner and Admin can access this page
  if (isLoaded && role !== "owner" && role !== "admin") {
    return (
      <div style={{ padding: "30px 18px" }}>
        <div
          style={{
            background: "var(--b1-color-surface)",
            borderRadius: "var(--b1-radius-xl)",
            padding: "32px 20px",
            border: "1px solid var(--b1-color-border-light)",
            textAlign: "center",
            boxShadow: "var(--b1-shadow-md)",
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: "var(--b1-radius-lg)",
              background: "var(--b1-color-warning-light)",
              color: "var(--b1-color-warning)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <ShieldAlert style={{ width: 26, height: 26 }} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--b1-color-text-main)", margin: "0 0 6px" }}>
            Acceso Requerido
          </h3>
          <p style={{ fontSize: 13, color: "var(--b1-color-text-muted)", margin: "0 0 20px", lineHeight: 1.4 }}>
            Iniciá sesión con una cuenta de Administrador o Dueño para gestionar la carta.
          </p>
          <Link
            href="/panel"
            className="b1-btn-primary"
            style={{ width: "100%", justifyContent: "center", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            <span>Volver al Panel</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "14px 18px 28px", position: "relative", minHeight: "100%", overflowX: "clip" }}>
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
        <CartaProductList
          products={carta.products}
          categories={carta.categories}
          realCategories={carta.realCategories}
          filteredProducts={carta.filteredProducts}
          selectedCategory={carta.selectedCategory}
          setSelectedCategory={carta.setSelectedCategory}
          searchQuery={carta.searchQuery}
          setSearchQuery={carta.setSearchQuery}
          loading={carta.loading}
          onOpenNewModal={carta.openNewProductModal}
          onEditProduct={carta.openEditProductModal}
          onDeleteProduct={carta.handleDeleteProduct}
        />

        <ProductEditModal
          isOpen={carta.isModalOpen}
          onClose={() => carta.setIsModalOpen(false)}
          editingProduct={carta.editingProduct}
          formName={carta.formName}
          setFormName={carta.setFormName}
          formCategoryId={carta.formCategoryId}
          setFormCategoryId={carta.setFormCategoryId}
          realCategories={carta.realCategories}
          formNewCatName={carta.formNewCatName}
          setFormNewCatName={carta.setFormNewCatName}
          formNewCatIcon={carta.formNewCatIcon}
          setFormNewCatIcon={carta.setFormNewCatIcon}
          formPrice={carta.formPrice}
          setFormPrice={carta.setFormPrice}
          formDescription={carta.formDescription}
          setFormDescription={carta.setFormDescription}
          formBadge={carta.formBadge}
          setFormBadge={carta.setFormBadge}
          formPrepTime={carta.formPrepTime}
          setFormPrepTime={carta.setFormPrepTime}
          formImage={carta.formImage}
          setFormImage={carta.setFormImage}
          imageUploading={carta.imageUploading}
          handleImageFileChange={carta.handleImageFileChange}
          handleSaveProduct={carta.handleSaveProduct}
          formRecipe={carta.formRecipe}
          stockOptions={carta.stockOptions}
          recipePickBarcode={carta.recipePickBarcode}
          setRecipePickBarcode={carta.setRecipePickBarcode}
          recipePickQty={carta.recipePickQty}
          setRecipePickQty={carta.setRecipePickQty}
          addRecipeLine={carta.addRecipeLine}
          removeRecipeLine={carta.removeRecipeLine}
          isQuickCreatingStock={carta.isQuickCreatingStock}
          setIsQuickCreatingStock={carta.setIsQuickCreatingStock}
          newStockName={carta.newStockName}
          setNewStockName={carta.setNewStockName}
          newStockCategory={carta.newStockCategory}
          setNewStockCategory={carta.setNewStockCategory}
          newStockUnit={carta.newStockUnit}
          setNewStockUnit={carta.setNewStockUnit}
          newStockInitialQty={carta.newStockInitialQty}
          setNewStockInitialQty={carta.setNewStockInitialQty}
          newStockUsedPerDish={carta.newStockUsedPerDish}
          setNewStockUsedPerDish={carta.setNewStockUsedPerDish}
          quickStockLoading={carta.quickStockLoading}
          quickStockMsg={carta.quickStockMsg}
          handleQuickCreateStock={carta.handleQuickCreateStock}
          formIngredientsManual={carta.formIngredientsManual}
          setFormIngredientsManual={carta.setFormIngredientsManual}
        />
      </div>
    </div>
  );
}
