"use client";

import { useState, useEffect, useMemo } from "react";
import { Product } from "@/components/home/ProductCard";
import { Category } from "@/components/home/CategoryChips";
import { normalizeString } from "@/lib/formatters";

export interface StoreInfo {
  name: string;
  tagline?: string;
  address?: string;
  whatsapp?: string;
  currencySymbol?: string;
  deliveryPrice?: number;
  deliveryFree?: boolean;
}

export function useCatalog(itemsPerPage: number = 6) {
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: "Alakary",
    tagline: "Menú Digital & Pedidos Online",
    address: "Paderewski 3666",
    whatsapp: "+5491172570867",
    deliveryPrice: 1000,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Load cached catalog on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem("kiosco_catalog_cache_v1");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.storeInfo) setStoreInfo(parsed.storeInfo);
        if (parsed.categories && parsed.categories.length > 0) setCategories(parsed.categories);
        if (parsed.products && parsed.products.length > 0) {
          setProducts(parsed.products);
          setLoading(false);
        }
      }
    } catch (e) {}
  }, []);

  // Refresh from API
  const refreshCatalog = () => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.storeInfo) setStoreInfo(data.storeInfo);
        if (data.categories) setCategories(data.categories);
        if (data.products) setProducts(data.products);
        setLoading(false);
        try {
          localStorage.setItem("kiosco_catalog_cache_v1", JSON.stringify(data));
        } catch (e) {}
      })
      .catch((err) => {
        console.error("Error loading products:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  // Filtered categories
  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => {
      const id = (cat.id || "").toLowerCase().trim();
      const name = (cat.name || "").toLowerCase().trim();
      if (
        id === "all" ||
        id === "todos" ||
        name === "todos" ||
        name === "all" ||
        name === "todo el menú" ||
        name === "todo el menu"
      ) {
        return false;
      }
      const count = products.filter(
        (p) => String(p.categoryId || "").trim().toLowerCase() === String(cat.id || "").trim().toLowerCase()
      ).length;
      return count > 0;
    });
  }, [categories, products]);

  // Adjust category if not visible
  useEffect(() => {
    if (
      selectedCategory !== "all" &&
      !visibleCategories.some((c) => String(c.id || "").trim().toLowerCase() === String(selectedCategory || "").trim().toLowerCase())
    ) {
      setSelectedCategory("all");
      setCurrentPage(1);
    }
  }, [visibleCategories, selectedCategory]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat =
        selectedCategory === "all" ||
        String(prod.categoryId || "").trim().toLowerCase() === String(selectedCategory || "").trim().toLowerCase();

      if (!searchQuery.trim()) return matchCat;

      const q = normalizeString(searchQuery);
      const matchName = normalizeString(prod.name).includes(q);
      const matchDesc = normalizeString(prod.description).includes(q);

      return matchCat && (matchName || matchDesc);
    });
  }, [products, selectedCategory, searchQuery]);

  const suggestions = useMemo(() => {
    return products.filter((p) => p.badge || Number(p.rating || 0) >= 4.9).slice(0, 4);
  }, [products]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const selectedCategoryName =
    selectedCategory === "all"
      ? "Todo el Menú"
      : categories.find((c) => c.id === selectedCategory)?.name || "Menú";

  return {
    storeInfo,
    categories,
    visibleCategories,
    products,
    setProducts,
    loading,
    selectedCategory,
    setSelectedCategory,
    selectedCategoryName,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredProducts,
    paginatedProducts,
    suggestions,
    refreshCatalog,
  };
}
