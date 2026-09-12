"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Plus,
  Search,
  Flame,
  Pizza,
  Sandwich,
  CupSoda,
  UtensilsCrossed,
  Sparkles,
  Edit2,
  Trash2,
  RefreshCw,
} from "lucide-react";

function getCategoryLucideIcon(catId: string, name?: string) {
  const lower = (catId + " " + (name || "")).toLowerCase();
  if (lower.includes("all") || lower.includes("todo")) return Flame;
  if (lower.includes("pizza")) return Pizza;
  if (lower.includes("burger") || lower.includes("hamburguesa") || lower.includes("lomo") || lower.includes("sandwich")) return Sandwich;
  if (lower.includes("empanada") || lower.includes("minuta")) return UtensilsCrossed;
  if (lower.includes("bebida") || lower.includes("gaseosa") || lower.includes("trago") || lower.includes("agua")) return CupSoda;
  if (lower.includes("especial") || lower.includes("promo")) return Sparkles;
  return UtensilsCrossed;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface RecipeLine {
  barcode: string;
  name: string;
  qty: number;
  unit?: string;
}

interface Product {
  id: number;
  categoryId: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  badge?: string;
  rating?: string;
  prepTime?: string;
  image?: string | null;
  linkedInventoryId?: string;
  recipe?: RecipeLine[];
}

interface StockOption {
  barcode: string;
  name: string;
  category?: string;
  unit?: string;
  stock: number;
}

function formatMoney(amount: number | string): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-AR");
}

export default function OwnerMenuManagementPage() {
  const { user, isLoaded } = useUser();
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modal / Sheet State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formNewCatName, setFormNewCatName] = useState("");
  const [formNewCatIcon, setFormNewCatIcon] = useState("🍽️");
  const [formPrice, setFormPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIngredientsManual, setFormIngredientsManual] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formPrepTime, setFormPrepTime] = useState("");
  const [formImage, setFormImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Recipe & Stock options
  const [formRecipe, setFormRecipe] = useState<RecipeLine[]>([]);
  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);
  const [recipePickBarcode, setRecipePickBarcode] = useState("");
  const [recipePickQty, setRecipePickQty] = useState<string>("1");

  // Inline Quick Stock Creation State
  const [isQuickCreatingStock, setIsQuickCreatingStock] = useState(false);
  const [newStockName, setNewStockName] = useState("");
  const [newStockCategory, setNewStockCategory] = useState("Cocina");
  const [newStockUnit, setNewStockUnit] = useState("unidades");
  const [newStockInitialQty, setNewStockInitialQty] = useState("10");
  const [newStockMinAlert, setNewStockMinAlert] = useState("5");
  const [newStockUsedPerDish, setNewStockUsedPerDish] = useState("1");
  const [quickStockLoading, setQuickStockLoading] = useState(false);
  const [quickStockMsg, setQuickStockMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load menu data
  const loadMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
      if (data.products) setProducts(data.products);
    } catch (e) {
      console.error("Error loading products:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock options from inventory
  const fetchStockOptions = async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      if (data.success && Array.isArray(data.inventory)) {
        setStockOptions(
          data.inventory.map((i: any) => ({
            barcode: i.barcode || i.id,
            name: i.name,
            category: i.category || "General",
            unit: i.unit || "unidades",
            stock: i.stock || 0,
          }))
        );
      }
    } catch (e) {
      console.error("Error fetching inventory:", e);
    }
  };

  useEffect(() => {
    loadMenu();
    fetchStockOptions();
  }, []);

  // Filter out duplicate 'all' category for the pills list
  const realCategories = useMemo(() => {
    return categories.filter((c) => c.id !== "all");
  }, [categories]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "all" && p.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (p.name || "").toLowerCase().includes(q);
        const matchDesc = (p.description || "").toLowerCase().includes(q);
        const matchIng = (p.ingredients || []).some((i) =>
          String(i).toLowerCase().includes(q)
        );
        if (!matchName && !matchDesc && !matchIng) return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Open Modal for New Product
  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategoryId(realCategories[0]?.id || "promos");
    setFormNewCatName("");
    setFormNewCatIcon("🍽️");
    setFormPrice("");
    setFormDescription("");
    setFormIngredientsManual("");
    setFormBadge("");
    setFormPrepTime("20-25 min");
    setFormImage(null);
    setFormRecipe([]);
    setRecipePickBarcode("");
    setRecipePickQty("1");
    setIsQuickCreatingStock(false);
    setQuickStockMsg(null);
    fetchStockOptions();
    setIsModalOpen(true);
  };

  // Open Modal for Edit Product
  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name || "");
    setFormCategoryId(prod.categoryId || realCategories[0]?.id || "promos");
    setFormNewCatName("");
    setFormNewCatIcon("🍽️");
    setFormPrice(String(prod.price ?? ""));
    setFormDescription(prod.description || "");
    const initialIngredients = Array.isArray(prod.ingredients) ? prod.ingredients : [];
    setFormIngredientsManual(initialIngredients.join(", "));
    setFormBadge(prod.badge || "");
    setFormPrepTime(prod.prepTime || "");
    setFormImage(prod.image || null);
    const initialRecipe = Array.isArray(prod.recipe) ? prod.recipe : [];
    setFormRecipe(initialRecipe);
    setRecipePickBarcode("");
    setRecipePickQty("1");
    setIsQuickCreatingStock(false);
    setQuickStockMsg(null);
    fetchStockOptions();
    setIsModalOpen(true);
  };

  // Add ingredient line to recipe from selected stock item
  const addRecipeLine = () => {
    if (!recipePickBarcode) return;

    if (recipePickBarcode === "__create_new__") {
      setIsQuickCreatingStock(true);
      return;
    }

    const parsedQty = Math.max(0.01, parseFloat(recipePickQty) || 1);
    const option = stockOptions.find((o) => o.barcode === recipePickBarcode);
    if (!option) return;

    setFormRecipe((prev) => {
      const existing = prev.find((r) => r.barcode === recipePickBarcode);
      if (existing) {
        return prev.map((r) =>
          r.barcode === recipePickBarcode ? { ...r, qty: parsedQty } : r
        );
      }
      return [
        ...prev,
        {
          barcode: option.barcode,
          name: option.name,
          qty: parsedQty,
          unit: option.unit,
        },
      ];
    });

    setRecipePickBarcode("");
    setRecipePickQty("1");
  };

  // Remove ingredient line from recipe
  const removeRecipeLine = (barcode: string) => {
    setFormRecipe((prev) => prev.filter((r) => r.barcode !== barcode));
  };

  // Handle Quick Create Stock Item and Link Directly to Recipe
  const handleQuickCreateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockName.trim()) {
      setQuickStockMsg({ type: "error", text: "Ingresá un nombre para el ingrediente." });
      return;
    }

    setQuickStockLoading(true);
    setQuickStockMsg(null);

    try {
      const res = await fetch("/api/inventory/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStockName.trim(),
          category: newStockCategory,
          unit: newStockUnit,
          qty: parseFloat(newStockInitialQty) || 0,
          minAlert: parseInt(newStockMinAlert, 10) || 5,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "No se pudo crear el ingrediente en stock.");
      }

      const createdItem = data.item;
      const barcodeOrId = createdItem.barcode || createdItem.id;
      const unit = createdItem.unit || newStockUnit;
      const usedQty = Math.max(0.01, parseFloat(newStockUsedPerDish) || 1);

      // 1. Add to local stockOptions
      const newOption: StockOption = {
        barcode: barcodeOrId,
        name: createdItem.name,
        category: createdItem.category || newStockCategory,
        unit: unit,
        stock: createdItem.stock || parseFloat(newStockInitialQty) || 0,
      };

      setStockOptions((prev) => [newOption, ...prev.filter((o) => o.barcode !== barcodeOrId)]);

      // 2. Add to current dish recipe immediately
      setFormRecipe((prev) => [
        ...prev.filter((r) => r.barcode !== barcodeOrId),
        {
          barcode: barcodeOrId,
          name: createdItem.name,
          qty: usedQty,
          unit: unit,
        },
      ]);

      // 3. Reset Quick Create Form
      setNewStockName("");
      setNewStockInitialQty("10");
      setNewStockUsedPerDish("1");
      setIsQuickCreatingStock(false);
      setRecipePickBarcode("");
      setQuickStockMsg({
        type: "success",
        text: `¡"${createdItem.name}" guardado en stock y vinculado al plato!`,
      });

      // Refresh stock options in background
      fetchStockOptions();
    } catch (err: any) {
      setQuickStockMsg({ type: "error", text: err.message || "Error al crear ingrediente." });
    } finally {
      setQuickStockLoading(false);
    }
  };

  // Handle Image File Selection
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/dev/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            dataBase64: base64,
          }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          setFormImage(data.url);
        } else {
          setFormImage(base64);
        }
      } catch {
        setFormImage(base64);
      } finally {
        setImageUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Product (Dish)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      alert("Por favor completá el nombre y el precio del plato.");
      return;
    }

    // Combine ingredients from recipe and manual ingredients seamlessly
    const recipeNames = formRecipe.map((r) => r.name.trim()).filter(Boolean);
    const manualNames = formIngredientsManual.trim()
      ? formIngredientsManual
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    let finalIngredients = Array.from(new Set([...recipeNames, ...manualNames]));
    if (finalIngredients.length === 0 && recipeNames.length > 0) {
      finalIngredients = recipeNames;
    }

    try {
      const res = await fetch("/api/menu/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct ? editingProduct.id : undefined,
          name: formName,
          categoryId: formCategoryId === "__new__" ? undefined : formCategoryId,
          newCategoryName: formCategoryId === "__new__" ? formNewCatName : undefined,
          newCategoryIcon: formCategoryId === "__new__" ? formNewCatIcon : undefined,
          price: parseFloat(formPrice) || 0,
          description: formDescription,
          ingredients: finalIngredients,
          badge: formBadge || undefined,
          prepTime: formPrepTime || undefined,
          image: formImage,
          recipe: formRecipe,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        loadMenu();
      } else {
        alert("Error al guardar: " + (data.message || "Error desconocido"));
      }
    } catch (err: any) {
      alert("Error al guardar producto: " + err.message);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar "${name}" de la carta?`)) return;

    try {
      const res = await fetch("/api/menu/product/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("No se pudo eliminar el producto.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

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
              fontSize: 24,
              margin: "0 auto 14px",
            }}
          >
            <i className="fas fa-ban"></i>
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
            style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
          >
            ← Volver al Panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── 1. GREETING & ACTION HEADER ────────────────────────────────────── */}
      <section className="b1-greeting-section" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBottom: 10 }}>
        <div>
          <h2 className="b1-greeting-title" style={{ fontSize: 18, margin: 0 }}>
            Gestión de Carta
          </h2>
          <p className="b1-greeting-subtitle" style={{ margin: "2px 0 0" }}>
            {products.length} platos disponibles para clientes
          </p>
        </div>

        <button
          type="button"
          className="b1-btn-primary"
          style={{ width: "auto", padding: "10px 18px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={openNewProductModal}
        >
          <Plus style={{ width: 16, height: 16 }} />
          <span>Nuevo Plato</span>
        </button>
      </section>

      {/* ── 2. SEARCH BAR ──────────────────────────────────────────────────── */}
      <section className="b1-search-container">
        <div className="b1-search-box">
          <Search className="b1-search-icon" style={{ width: 16, height: 16 }} />
          <input
            type="text"
            className="b1-search-input"
            placeholder="Buscar por plato o ingrediente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--b1-color-text-muted)",
                cursor: "pointer",
                fontSize: 13,
              }}
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
      </section>

      {/* ── 3. CATEGORIES SCROLL ───────────────────────────────────────────── */}
      <section className="b1-categories-wrapper">
        <div className="b1-categories-scroll">
          <button
            type="button"
            className={`b1-category-pill ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            <Flame style={{ width: 15, height: 15, color: selectedCategory === "all" ? "#fff" : "#EA580C" }} />
            <span>Todos ({products.length})</span>
          </button>

          {realCategories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            const CatIcon = getCategoryLucideIcon(cat.id, cat.name);
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                className={`b1-category-pill ${isSelected ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <CatIcon style={{ width: 15, height: 15, color: isSelected ? "#fff" : "#EA580C" }} />
                <span>{cat.name} ({count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 4. PRODUCTS ROW LIST ───────────────────────────────────────────── */}
      <section className="b1-section-header">
        <h3 className="b1-section-title">
          {searchQuery
            ? `Resultados para "${searchQuery}"`
            : selectedCategory === "all"
            ? "Todos los Platos"
            : realCategories.find((c) => c.id === selectedCategory)?.name || "Platos"}
        </h3>
      </section>

      <main className="b1-products-list">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--b1-color-text-muted)" }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 8, display: "block" }}></i>
            <span>Cargando platos...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "#fff",
              borderRadius: "var(--b1-radius-lg)",
              border: "1px solid var(--b1-color-border-light)",
            }}
          >
            <Search style={{ width: 36, height: 36, color: "var(--b1-color-text-muted)", margin: "0 auto 10px", display: "block" }} />
            <strong style={{ display: "block", color: "var(--b1-color-text-main)", fontSize: 15, marginBottom: 4 }}>
              {products.length > 0 ? "No encontramos platos con este filtro" : "No tenés platos creados aún"}
            </strong>
            <span style={{ fontSize: 13, color: "var(--b1-color-text-muted)", display: "block", marginBottom: 16, maxWidth: 360, margin: "0 auto 16px" }}>
              {products.length > 0
                ? "Probá cambiando la categoría o borrando el término de búsqueda para ver todos los platos."
                : "¡Hacé clic en el botón de abajo para armar la carta digital de tu local!"}
            </span>
            {products.length > 0 ? (
              <button
                type="button"
                className="b1-btn-primary"
                style={{ width: "auto", margin: "0 auto", padding: "8px 18px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
                <span>Limpiar filtros / Ver todos</span>
              </button>
            ) : (
              <button
                type="button"
                className="b1-btn-primary"
                style={{ width: "auto", margin: "0 auto", padding: "8px 18px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={openNewProductModal}
              >
                <Plus style={{ width: 15, height: 15 }} />
                <span>Crear Primer Plato</span>
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((p) => {
            const categoryObj = categories.find((c) => c.id === p.categoryId);
            const catLabel = categoryObj ? `${categoryObj.icon || "🍽️"} ${categoryObj.name}` : p.categoryId;

            return (
              <div
                key={p.id}
                className="b1-product-row-card"
                onClick={() => openEditProductModal(p)}
                style={{ cursor: "pointer" }}
              >
                {/* Food Thumbnail on Left */}
                <div className="b1-row-media-container">
                  <img
                    src={p.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200"}
                    alt={p.name}
                    className="b1-row-thumb"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200";
                    }}
                  />
                </div>

                {/* Info Container on Right */}
                <div className="b1-row-info">
                  <div className="b1-row-badge-row">
                    {p.badge ? (
                      <span className="b1-item-badge">{p.badge}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--b1-color-text-muted)", fontWeight: 600 }}>
                        {catLabel}
                      </span>
                    )}
                    {p.recipe && p.recipe.length > 0 && (
                      <span style={{ fontSize: 10, background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                        <i className="fas fa-link mr-1"></i> {p.recipe.length} insumos de stock
                      </span>
                    )}
                  </div>

                  <h4 className="b1-row-title">{p.name}</h4>
                  <p className="b1-row-desc">{p.description || (p.ingredients && p.ingredients.length > 0 ? p.ingredients.join(", ") : "Sin descripción")}</p>

                  <div className="b1-row-price-row">
                    <span className="b1-row-price">${formatMoney(p.price)}</span>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: 6, marginLeft: "auto" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="b1-cat-pill"
                        style={{ padding: "4px 10px", fontSize: 11, background: "var(--b1-color-surface-subtle)" }}
                        onClick={() => openEditProductModal(p)}
                        title="Editar plato"
                      >
                        <i className="fas fa-edit"></i>
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        className="b1-cat-pill"
                        style={{ padding: "4px 10px", fontSize: 11, color: "var(--b1-color-danger)", borderColor: "rgba(239,68,68,0.3)", background: "var(--b1-color-danger-light)" }}
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        title="Borrar plato"
                      >
                        <i className="fas fa-trash"></i>
                        <span>Borrar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════
           MODAL: BOTTOM SHEET FOR CREATING / EDITING DISHES
           ══════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="b1-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="b1-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: "28px 28px 0 0", maxHeight: "92vh", display: "flex", flexDirection: "column" }}
          >
            {/* Sheet Handle */}
            <div className="b1-sheet-drag-handle"></div>

            <div className="b1-detail-hero-wrapper" style={{ position: "relative", height: formImage ? 150 : 54, background: formImage ? "#000" : "var(--b1-color-surface-subtle)", overflow: "hidden", borderRadius: "28px 28px 0 0" }}>
              {formImage && (
                <>
                  <img
                    src={formImage}
                    alt="Preview"
                    className="b1-detail-hero-img"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "70%",
                      background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)",
                      pointerEvents: "none",
                    }}
                  />
                </>
              )}
              <div className="b1-detail-nav-top">
                <div style={{ fontWeight: 800, fontSize: 14, color: formImage ? "#fff" : "var(--b1-color-text-main)", textShadow: formImage ? "0 1px 4px rgba(0,0,0,0.8)" : "none" }}>
                  {editingProduct ? `Editar Plato: ${editingProduct.name}` : "Crear Nuevo Plato"}
                </div>
                <button
                  type="button"
                  className="b1-detail-circle-btn"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Cerrar"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="b1-detail-body" style={{ overflowY: "auto", flex: 1, padding: "18px 20px" }}>
                
                {/* 1. Basic Info: Name */}
                <div className="b1-form-group">
                  <label className="b1-form-label">
                    <i className="fas fa-utensils"></i> Nombre del Plato *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Hamburguesa Completa, Pizza Especial, etc."
                    className="b1-input"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                {/* 2. Category Selection */}
                <div className="b1-form-group">
                  <label className="b1-form-label">
                    <i className="fas fa-th-large"></i> Categoría en Menú *
                  </label>
                  <select
                    className="b1-input"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                  >
                    {realCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon || "🍽️"} {c.name}
                      </option>
                    ))}
                    <option value="__new__">➕ + Crear nueva categoría de menú...</option>
                  </select>
                </div>

                {/* New Category Inputs */}
                {formCategoryId === "__new__" && (
                  <div
                    style={{
                      background: "var(--b1-color-surface-subtle)",
                      borderRadius: "var(--b1-radius-md)",
                      padding: 12,
                      border: "1px solid var(--b1-color-border-light)",
                      marginBottom: 14,
                    }}
                  >
                    <div className="b1-form-group" style={{ marginBottom: 8 }}>
                      <label className="b1-form-label">Nombre Nueva Categoría</label>
                      <input
                        type="text"
                        placeholder="Ej: Minutas, Pastas, Postres..."
                        className="b1-input"
                        value={formNewCatName}
                        onChange={(e) => setFormNewCatName(e.target.value)}
                      />
                    </div>
                    <div className="b1-form-group" style={{ marginBottom: 0 }}>
                      <label className="b1-form-label">Emoji / Ícono</label>
                      <input
                        type="text"
                        placeholder="🍝"
                        maxLength={2}
                        className="b1-input"
                        style={{ width: 80, textAlign: "center" }}
                        value={formNewCatIcon}
                        onChange={(e) => setFormNewCatIcon(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* 3. Price */}
                <div className="b1-form-group">
                  <label className="b1-form-label">
                    <i className="fas fa-dollar-sign"></i> Precio al Público ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="12000"
                    className="b1-input"
                    style={{ fontSize: 16, fontWeight: 800, color: "var(--b1-color-primary)" }}
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                  />
                </div>

                {/* 4. Description */}
                <div className="b1-form-group">
                  <label className="b1-form-label">
                    <i className="far fa-edit"></i> Descripción del Plato
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Pan casero brioche, doble medallón de carne 120g, queso cheddar fundido..."
                    className="b1-input"
                    style={{ resize: "none", height: "auto" }}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                {/* ══════════════════════════════════════════════════════════════
                     5. INGREDIENTS & STOCK SELECTOR (DYNAMIC RECIPE)
                     ══════════════════════════════════════════════════════════════ */}
                <div
                  style={{
                    background: "var(--b1-color-surface-subtle)",
                    border: "1.5px solid var(--b1-color-border-light)",
                    borderRadius: "var(--b1-radius-lg)",
                    padding: 14,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label className="b1-form-label" style={{ margin: 0, fontWeight: 800, color: "var(--b1-color-text-main)", fontSize: 13 }}>
                      <i className="fas fa-boxes" style={{ color: "var(--b1-color-primary)" }}></i> Ingredientes y Descuento de Stock
                    </label>
                    <span style={{ fontSize: 11, background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                      {formRecipe.length} {formRecipe.length === 1 ? "insumo vinculado" : "insumos vinculados"}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: "var(--b1-color-text-muted)", margin: "0 0 12px", lineHeight: 1.35 }}>
                    Elegí los ingredientes desde tu <strong>Stock</strong>. Si un ingrediente no existe aún, podés crearlo al instante y se guardará en tu inventario.
                  </p>

                  {/* Feedback Message */}
                  {quickStockMsg && (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "var(--b1-radius-md)",
                        marginBottom: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        background: quickStockMsg.type === "success" ? "#dcfce7" : "#fee2e2",
                        color: quickStockMsg.type === "success" ? "#15803d" : "#b91c1c",
                        border: `1px solid ${quickStockMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                      }}
                    >
                      {quickStockMsg.type === "success" ? "✅ " : "⚠️ "} {quickStockMsg.text}
                    </div>
                  )}

                  {/* Assigned Recipe Lines List */}
                  {formRecipe.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                      {formRecipe.map((line) => {
                        const stockItem = stockOptions.find((o) => o.barcode === line.barcode);
                        const currentStock = stockItem ? stockItem.stock : 0;
                        const isLowStock = currentStock <= 0;

                        return (
                          <div
                            key={line.barcode}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: "var(--b1-color-surface, #fff)",
                              border: "1px solid var(--b1-color-border-light, #E2E8F0)",
                              borderRadius: "var(--b1-radius-md, 12px)",
                              padding: "10px 14px",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                              gap: 12,
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                              <strong style={{ fontSize: 13, color: "var(--b1-color-text-main, #0F172A)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {line.name}
                              </strong>
                              <div style={{ fontSize: 11, color: "var(--b1-color-text-muted, #64748B)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span>
                                  Descuenta: <strong style={{ color: "var(--b1-color-text-main, #0F172A)" }}>{line.qty} {line.unit || "u."}</strong> por plato
                                </span>
                                <span>•</span>
                                <span style={{ color: isLowStock ? "#DC2626" : "var(--b1-color-text-muted, #64748B)" }}>
                                  Stock: <strong style={{ color: isLowStock ? "#DC2626" : "#059669" }}>{currentStock} {line.unit || "u."}</strong>
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeRecipeLine(line.barcode)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--b1-color-text-muted, #94A3B8)",
                                width: 32,
                                height: 32,
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                flexShrink: 0,
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "#FEE2E2";
                                (e.currentTarget as HTMLElement).style.color = "#DC2626";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                                (e.currentTarget as HTMLElement).style.color = "var(--b1-color-text-muted, #94A3B8)";
                              }}
                              title="Quitar ingrediente de la receta"
                            >
                              <Trash2 style={{ width: 16, height: 16 }} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "14px",
                        textAlign: "center",
                        background: "#fff",
                        border: "1px dashed var(--b1-color-border, #CBD5E1)",
                        borderRadius: "var(--b1-radius-md, 12px)",
                        marginBottom: 12,
                        fontSize: 12,
                        color: "var(--b1-color-text-muted, #64748B)",
                      }}
                    >
                      <i className="fas fa-info-circle mr-1" style={{ color: "var(--b1-color-primary, #EA580C)" }}></i>
                      Todavía no agregaste ingredientes del stock. Seleccionalos abajo para descontar stock automáticamente.
                    </div>
                  )}

                  {/* Selector Bar: Dropdown + Qty + Add Button */}
                  {!isQuickCreatingStock && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <select
                          className="b1-input"
                          style={{ flex: 1, fontSize: 13 }}
                          value={recipePickBarcode}
                          onChange={(e) => {
                            if (e.target.value === "__create_new__") {
                              setIsQuickCreatingStock(true);
                              setRecipePickBarcode("");
                            } else {
                              setRecipePickBarcode(e.target.value);
                            }
                          }}
                        >
                          <option value="">-- Seleccionar ingrediente del Stock --</option>
                          <option value="__create_new__" style={{ fontWeight: 800, color: "var(--b1-color-primary)" }}>
                            ✨ ➕ + Crear nuevo ingrediente en Stock...
                          </option>
                          {stockOptions.map((o) => (
                            <option key={o.barcode} value={o.barcode}>
                              {o.name} ({o.stock} {o.unit || "u."} en stock)
                            </option>
                          ))}
                        </select>

                        <div style={{ display: "flex", alignItems: "center", width: 100 }}>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            placeholder="Cant."
                            className="b1-input"
                            style={{ textAlign: "center", fontSize: 13, padding: "8px 4px" }}
                            value={recipePickQty}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setRecipePickQty(e.target.value)}
                          />
                        </div>

                        <button
                          type="button"
                          className="b1-btn-primary"
                          style={{ width: "auto", padding: "0 14px", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          onClick={addRecipeLine}
                          disabled={!recipePickBarcode}
                          title="Vincular ingrediente"
                        >
                          <Plus style={{ width: 16, height: 16 }} />
                        </button>
                      </div>

                      {/* Quick CTA to create new stock */}
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => setIsQuickCreatingStock(true)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--b1-color-primary)",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 0",
                          }}
                        >
                          <i className="fas fa-plus-circle"></i>
                          <span>¿El ingrediente no está en la lista? Crealo acá</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── INLINE QUICK STOCK CREATION FORM ────────────────────── */}
                  {isQuickCreatingStock && (
                    <div
                      style={{
                        background: "#fff",
                        border: "2px solid var(--b1-color-primary)",
                        borderRadius: "var(--b1-radius-md)",
                        padding: 14,
                        marginTop: 6,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <strong style={{ fontSize: 13, color: "var(--b1-color-text-main)", display: "flex", alignItems: "center", gap: 6 }}>
                          <i className="fas fa-sparkles" style={{ color: "var(--b1-color-primary)" }}></i>
                          Crear Ingrediente y Guardar en Stock
                        </strong>
                        <button
                          type="button"
                          onClick={() => setIsQuickCreatingStock(false)}
                          style={{ background: "none", border: "none", color: "var(--b1-color-text-muted)", cursor: "pointer", fontSize: 13 }}
                        >
                          ✕ Cancelar
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div style={{ gridColumn: "span 2" }}>
                          <label className="b1-form-label" style={{ fontSize: 11, marginBottom: 3 }}>
                            Nombre del Ingrediente *
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: Masa de Pizza, Panceta, Tomate, Carne Picada..."
                            className="b1-input"
                            style={{ fontSize: 13 }}
                            value={newStockName}
                            onChange={(e) => setNewStockName(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="b1-form-label" style={{ fontSize: 11, marginBottom: 3 }}>
                            Categoría en Stock
                          </label>
                          <select
                            className="b1-input"
                            style={{ fontSize: 12 }}
                            value={newStockCategory}
                            onChange={(e) => setNewStockCategory(e.target.value)}
                          >
                            <option value="Cocina">Cocina</option>
                            <option value="Carnes">Carnes</option>
                            <option value="Verduras">Verduras</option>
                            <option value="Lácteos">Lácteos</option>
                            <option value="Panadería">Panadería</option>
                            <option value="Fiambres">Fiambres</option>
                            <option value="Condimentos">Condimentos</option>
                            <option value="Bebidas">Bebidas</option>
                            <option value="General">General</option>
                          </select>
                        </div>

                        <div>
                          <label className="b1-form-label" style={{ fontSize: 11, marginBottom: 3 }}>
                            Unidad de Medida
                          </label>
                          <select
                            className="b1-input"
                            style={{ fontSize: 12 }}
                            value={newStockUnit}
                            onChange={(e) => setNewStockUnit(e.target.value)}
                          >
                            <option value="unidades">unidades</option>
                            <option value="kg">kilogramos (kg)</option>
                            <option value="g">gramos (g)</option>
                            <option value="litros">litros</option>
                            <option value="ml">mililitros (ml)</option>
                            <option value="porciones">porciones</option>
                            <option value="paquete">paquete</option>
                          </select>
                        </div>

                        <div>
                          <label className="b1-form-label" style={{ fontSize: 11, marginBottom: 3 }}>
                            Stock Inicial Disponible
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="10"
                            className="b1-input"
                            style={{ fontSize: 12 }}
                            value={newStockInitialQty}
                            onChange={(e) => setNewStockInitialQty(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="b1-form-label" style={{ fontSize: 11, marginBottom: 3 }}>
                            Usa por Plato (descuento)
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            placeholder="1"
                            className="b1-input"
                            style={{ fontSize: 12 }}
                            value={newStockUsedPerDish}
                            onChange={(e) => setNewStockUsedPerDish(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="b1-btn-primary"
                          style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "10px" }}
                          onClick={handleQuickCreateStock}
                          disabled={quickStockLoading}
                        >
                          {quickStockLoading ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-1"></i> Guardando en Stock...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-check-circle mr-1"></i> Guardar en Stock y Vincular al Plato
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Customer-Facing Ingredients Preview & Extra Notes */}
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--b1-color-border-light)" }}>
                    <label className="b1-form-label" style={{ fontSize: 11, color: "var(--b1-color-text-muted)", marginBottom: 4 }}>
                      👀 Ingredientes visibles para los clientes en el menú:
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      {formRecipe.length > 0 ? (
                        formRecipe.map((r) => (
                          <span
                            key={r.barcode}
                            style={{
                              background: "#f1f5f9",
                              color: "#334155",
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "3px 8px",
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                            }}
                          >
                            {r.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--b1-color-text-muted)", fontStyle: "italic" }}>
                          (Se generarán automáticamente según los insumos seleccionados arriba)
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <label className="b1-form-label" style={{ fontSize: 11, marginBottom: 2 }}>
                        Ingredientes adicionales o personalizados (separados por coma):
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Salsa de la casa, orégano, pan artesanal..."
                        className="b1-input"
                        style={{ fontSize: 12 }}
                        value={formIngredientsManual}
                        onChange={(e) => setFormIngredientsManual(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Badge & Prep Time */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div className="b1-form-group" style={{ margin: 0 }}>
                    <label className="b1-form-label">
                      <i className="fas fa-star"></i> Badge / Etiqueta
                    </label>
                    <input
                      type="text"
                      placeholder="Más Pedido, Nuevo..."
                      className="b1-input"
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                    />
                  </div>
                  <div className="b1-form-group" style={{ margin: 0 }}>
                    <label className="b1-form-label">
                      <i className="fas fa-clock"></i> Tiempo Estimado
                    </label>
                    <input
                      type="text"
                      placeholder="20-25 min"
                      className="b1-input"
                      value={formPrepTime}
                      onChange={(e) => setFormPrepTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* 7. Photo Upload */}
                <div className="b1-form-group">
                  <label className="b1-form-label">
                    <i className="fas fa-camera"></i> Foto del Plato
                  </label>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ fontSize: 12, flex: 1 }}
                      onChange={handleImageFileChange}
                    />
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <input
                      type="text"
                      placeholder="O pegá URL directa de imagen..."
                      className="b1-input"
                      style={{ fontSize: 12 }}
                      value={formImage || ""}
                      onChange={(e) => setFormImage(e.target.value)}
                    />
                  </div>
                  {imageUploading && (
                    <span style={{ fontSize: 11, color: "var(--b1-color-primary)", fontWeight: 700, marginTop: 4, display: "block" }}>
                      <i className="fas fa-spinner fa-spin mr-1"></i> Subiendo imagen...
                    </span>
                  )}
                </div>
              </div>

              {/* Sticky Footer CTA */}
              <div className="b1-detail-footer" style={{ borderTop: "1px solid var(--b1-color-border-light)", display: "flex", gap: 8, padding: "14px 20px" }}>
                <button type="submit" className="b1-btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                  <i className="fas fa-check"></i>
                  <span>{editingProduct ? "Guardar Cambios" : "Crear Plato"}</span>
                </button>
                <button
                  type="button"
                  className="b1-cat-pill"
                  style={{ padding: "12px 18px", borderRadius: "var(--b1-radius-pill)" }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
