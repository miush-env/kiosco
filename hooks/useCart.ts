"use client";

import { useState, useEffect, useMemo } from "react";
import { CartItem } from "@/components/modals/CartModal";
import { Product } from "@/components/home/ProductCard";

function recordCustomerNotification(productName: string, productImage?: string | null, quantity: number = 1) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem("kiosco_customer_notifications") || "[]");
    const newEntry = {
      id: `notif_cart_${Date.now()}`,
      type: "cart",
      title: "Agregado al carrito",
      message: quantity > 1 ? `Agregaste ${quantity}x "${productName}" a tu pedido.` : `Agregaste "${productName}" a tu pedido.`,
      productName,
      productImage: productImage || null,
      quantity,
      timestamp: new Date().toISOString(),
      read: false,
    };
    localStorage.setItem(
      "kiosco_customer_notifications",
      JSON.stringify([newEntry, ...existing].slice(0, 30))
    );
    window.dispatchEvent(new Event("kiosco_customer_notifications_updated"));
  } catch (e) {}
}

export function useCart(products: Product[]) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [quickAddedId, setQuickAddedId] = useState<number | null>(null);
  const [cartNotification, setCartNotification] = useState<{
    id: number;
    productName: string;
    message: string;
  } | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("kiosco_cart_v1");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch (e) {
      console.error("[Cart load error]", e);
    } finally {
      setIsCartLoaded(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isCartLoaded) return;
    try {
      localStorage.setItem("kiosco_cart_v1", JSON.stringify(cart));
    } catch (e) {
      console.error("[Cart save error]", e);
    }
  }, [cart, isCartLoaded]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const addProductFromDetail = (product: Product, quantity: number, comment?: string) => {
    const latestProduct = products.find((p) => Number(p.id) === Number(product.id)) || product;
    const inCart = cart
      .filter((i) => Number(i.id) === Number(latestProduct.id))
      .reduce((s, i) => s + i.quantity, 0);
    const cap = latestProduct.availableStock;
    const maxCanAdd = cap !== undefined ? Math.max(0, cap - inCart) : 999;

    if (maxCanAdd <= 0) {
      alert(`No podés agregar más porciones de "${latestProduct.name}". Ya tenés todo el stock disponible en tu carrito (${cap || 0}).`);
      return false;
    }

    const qtyToAdd = Math.min(quantity, maxCanAdd);
    if (qtyToAdd <= 0) return false;

    const isEmpanada =
      latestProduct.categoryId === "empanadas" ||
      latestProduct.name.toLowerCase().includes("empanada");

    let finalName = latestProduct.name;
    let finalPrice = latestProduct.price;
    let finalQty = qtyToAdd;

    if (isEmpanada) {
      if (quantity === 6) {
        finalName = `${latestProduct.name} (Media docena - 6u)`;
        finalPrice = 10000;
        finalQty = 1;
      } else if (quantity === 12) {
        finalName = `${latestProduct.name} (1 Docena - 12u)`;
        finalPrice = 18000;
        finalQty = 1;
      } else if (quantity === 18) {
        finalName = `${latestProduct.name} (Docena y media - 18u)`;
        finalPrice = 28000;
        finalQty = 1;
      } else if (quantity % 12 === 0) {
        const numDocenas = quantity / 12;
        finalName = `${latestProduct.name} (1 Docena - 12u)`;
        finalPrice = 18000;
        finalQty = numDocenas;
      } else {
        const numDocenas = Math.floor(quantity / 12);
        const totalPrice = numDocenas * 18000 + 10000;
        finalName = `${latestProduct.name} (${numDocenas} docenas y media - ${quantity}u)`;
        finalPrice = totalPrice;
        finalQty = 1;
      }
    }

    const trimmedComment = (comment || "").trim();
    const cartId = `${latestProduct.id}_${finalName}_${trimmedComment || "none"}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + finalQty } : item
        );
      }
      return [
        ...prev,
        {
          id: latestProduct.id,
          cartId: cartId,
          name: finalName,
          price: finalPrice,
          quantity: finalQty,
          comment: trimmedComment || undefined,
          image: latestProduct.image,
          linkedInventoryId: latestProduct.linkedInventoryId,
          availableStock: cap,
        },
      ];
    });

    setCartNotification({
      id: Date.now(),
      productName: finalName,
      message: `${finalName} agregado al carrito`,
    });

    // Guardar en el historial de Avisos y Novedades
    recordCustomerNotification(finalName, latestProduct.image, finalQty);

    return true;
  };

  const quickAddToCart = (product: Product) => {
    const latestProduct = products.find((p) => Number(p.id) === Number(product.id)) || product;
    const inCart = cart
      .filter((i) => Number(i.id) === Number(latestProduct.id))
      .reduce((s, i) => s + i.quantity, 0);
    const cap = latestProduct.availableStock;
    const maxCanAdd = cap !== undefined ? Math.max(0, cap - inCart) : 999;

    if (maxCanAdd <= 0) {
      alert(`No podés agregar más porciones de "${latestProduct.name}". Ya tenés todo el stock disponible en tu carrito (${cap || 0}).`);
      return;
    }

    const isEmpanada =
      latestProduct.categoryId === "empanadas" ||
      latestProduct.name.toLowerCase().includes("empanada");

    const finalName = isEmpanada
      ? `${latestProduct.name} (Media docena - 6u)`
      : latestProduct.name;
    const finalPrice = isEmpanada ? 10000 : latestProduct.price;

    const cartId = `${latestProduct.id}_${finalName}_none`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: latestProduct.id,
          cartId: cartId,
          name: finalName,
          price: finalPrice,
          quantity: 1,
          comment: undefined,
          image: latestProduct.image,
          linkedInventoryId: latestProduct.linkedInventoryId,
          availableStock: cap,
        },
      ];
    });

    setQuickAddedId(latestProduct.id);
    setCartNotification({
      id: Date.now(),
      productName: finalName,
      message: `${finalName} agregado al carrito`,
    });

    // Guardar en el historial de Avisos y Novedades
    recordCustomerNotification(finalName, latestProduct.image, 1);
    setTimeout(() => {
      setQuickAddedId((prev) => (prev === latestProduct.id ? null : prev));
    }, 700);
  };

  const updateCartQty = (cartId: string, delta: number) => {
    setCart((prev) => {
      const itemToUpdate = prev.find((i) => i.cartId === cartId);
      if (!itemToUpdate) return prev;

      const latestProd = products.find((p) => Number(p.id) === Number(itemToUpdate.id));
      const cap = latestProd?.availableStock !== undefined ? latestProd.availableStock : itemToUpdate.availableStock;

      if (delta > 0 && cap !== undefined) {
        const totalInCartForProduct = prev
          .filter((i) => Number(i.id) === Number(itemToUpdate.id))
          .reduce((sum, i) => sum + i.quantity, 0);

        if (totalInCartForProduct >= cap) {
          alert(`No podés agregar más de ${cap} ${cap === 1 ? "porción" : "porciones"} de "${itemToUpdate.name}" (stock límite de cocina).`);
          return prev;
        }
      }

      return prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty, availableStock: cap } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCartAll = () => {
    if (confirm("¿Vaciar todo el pedido?")) {
      setCart([]);
    }
  };

  const emptyCartSilently = () => {
    setCart([]);
    try {
      localStorage.removeItem("kiosco_cart_v1");
    } catch (e) {}
  };

  const dismissCartNotification = () => {
    setCartNotification(null);
  };

  return {
    cart,
    setCart,
    isCartLoaded,
    cartItemCount,
    cartSubtotal,
    quickAddedId,
    cartNotification,
    dismissCartNotification,
    addProductFromDetail,
    quickAddToCart,
    updateCartQty,
    clearCartAll,
    emptyCartSilently,
  };
}
