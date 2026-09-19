"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Category, Product, RecipeLine, StockOption } from "@/types/carta";

export function useCartaManagement() {
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
  const loadMenu = useCallback(async () => {
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
  }, []);

  // Fetch stock options from inventory
  const fetchStockOptions = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadMenu();
    fetchStockOptions();
  }, [loadMenu, fetchStockOptions]);

  const realCategories = useMemo(() => {
    return categories.filter((c) => c.id !== "all");
  }, [categories]);

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

  const openNewProductModal = useCallback(() => {
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
  }, [realCategories, fetchStockOptions]);

  const openEditProductModal = useCallback((prod: Product) => {
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
  }, [realCategories, fetchStockOptions]);

  const addRecipeLine = useCallback(() => {
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
  }, [recipePickBarcode, recipePickQty, stockOptions]);

  const removeRecipeLine = useCallback((barcode: string) => {
    setFormRecipe((prev) => prev.filter((r) => r.barcode !== barcode));
  }, []);

  const handleQuickCreateStock = useCallback(async (e: React.FormEvent) => {
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

      const newOption: StockOption = {
        barcode: barcodeOrId,
        name: createdItem.name,
        category: createdItem.category || newStockCategory,
        unit: unit,
        stock: createdItem.stock || parseFloat(newStockInitialQty) || 0,
      };

      setStockOptions((prev) => [newOption, ...prev.filter((o) => o.barcode !== barcodeOrId)]);

      setFormRecipe((prev) => [
        ...prev.filter((r) => r.barcode !== barcodeOrId),
        {
          barcode: barcodeOrId,
          name: createdItem.name,
          qty: usedQty,
          unit: unit,
        },
      ]);

      setNewStockName("");
      setNewStockInitialQty("10");
      setNewStockUsedPerDish("1");
      setIsQuickCreatingStock(false);
      setRecipePickBarcode("");
      setQuickStockMsg({
        type: "success",
        text: `¡"${createdItem.name}" guardado en stock y vinculado al plato!`,
      });

      fetchStockOptions();
    } catch (err: any) {
      setQuickStockMsg({ type: "error", text: err.message || "Error al crear ingrediente." });
    } finally {
      setQuickStockLoading(false);
    }
  }, [newStockName, newStockCategory, newStockUnit, newStockInitialQty, newStockMinAlert, newStockUsedPerDish, fetchStockOptions]);

  const handleImageFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  const handleSaveProduct = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      alert("Por favor completá el nombre y el precio del plato.");
      return;
    }

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
  }, [formName, formPrice, formRecipe, formIngredientsManual, editingProduct, formCategoryId, formNewCatName, formNewCatIcon, formDescription, formBadge, formPrepTime, formImage, loadMenu]);

  const handleDeleteProduct = useCallback(async (id: number, name: string) => {
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
  }, []);

  return {
    categories,
    products,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isModalOpen,
    setIsModalOpen,
    editingProduct,
    formName,
    setFormName,
    formCategoryId,
    setFormCategoryId,
    formNewCatName,
    setFormNewCatName,
    formNewCatIcon,
    setFormNewCatIcon,
    formPrice,
    setFormPrice,
    formDescription,
    setFormDescription,
    formIngredientsManual,
    setFormIngredientsManual,
    formBadge,
    setFormBadge,
    formPrepTime,
    setFormPrepTime,
    formImage,
    setFormImage,
    imageUploading,
    formRecipe,
    setFormRecipe,
    stockOptions,
    recipePickBarcode,
    setRecipePickBarcode,
    recipePickQty,
    setRecipePickQty,
    isQuickCreatingStock,
    setIsQuickCreatingStock,
    newStockName,
    setNewStockName,
    newStockCategory,
    setNewStockCategory,
    newStockUnit,
    setNewStockUnit,
    newStockInitialQty,
    setNewStockInitialQty,
    newStockMinAlert,
    setNewStockMinAlert,
    newStockUsedPerDish,
    setNewStockUsedPerDish,
    quickStockLoading,
    quickStockMsg,
    realCategories,
    filteredProducts,
    loadMenu,
    fetchStockOptions,
    openNewProductModal,
    openEditProductModal,
    addRecipeLine,
    removeRecipeLine,
    handleQuickCreateStock,
    handleImageFileChange,
    handleSaveProduct,
    handleDeleteProduct,
  };
}
