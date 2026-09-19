"use client";

import { useState, useEffect } from "react";
import { Product } from "@/components/home/ProductCard";

export function useModalManager() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Selected product detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailQty, setDetailQty] = useState<number>(1);
  const [detailComment, setDetailComment] = useState<string>("");

  // Mercado Pago Return Modal
  const [mpReturnModal, setMpReturnModal] = useState<{
    isOpen: boolean;
    status: "success" | "pending" | "failure";
    order: any | null;
    copied: boolean;
  }>({
    isOpen: false,
    status: "success",
    order: null,
    copied: false,
  });

  const isAnyModalOpen = Boolean(
    selectedProduct ||
    isCartOpen ||
    isCheckoutOpen ||
    isProfileOpen ||
    mpReturnModal.isOpen ||
    isAddressModalOpen ||
    isNotificationsOpen ||
    isMapPickerOpen
  );

  // Body scroll lock effect
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isAnyModalOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyTouchAction = document.body.style.touchAction;
      const originalBodyOverscroll = document.body.style.overscrollBehavior;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.body.style.overscrollBehavior = "none";
      document.documentElement.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.touchAction = originalBodyTouchAction;
        document.body.style.overscrollBehavior = originalBodyOverscroll;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isAnyModalOpen]);

  const openProductDetail = (product: Product, currentCartItems: { id: number; quantity: number }[]) => {
    setSelectedProduct(product);
    const inCart = currentCartItems
      .filter((i) => Number(i.id) === Number(product.id))
      .reduce((s, i) => s + i.quantity, 0);
    const remaining =
      product.availableStock !== undefined
        ? Math.max(0, product.availableStock - inCart)
        : 999;
    const isEmpanada = product.categoryId === "empanadas" || product.name.toLowerCase().includes("empanada");
    const minUnits = isEmpanada ? 6 : 1;
    setDetailQty(remaining >= minUnits ? minUnits : remaining > 0 ? remaining : 0);
    setDetailComment("");
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
    setDetailComment("");
  };

  return {
    isCartOpen,
    setIsCartOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isProfileOpen,
    setIsProfileOpen,
    isAddressModalOpen,
    setIsAddressModalOpen,
    isMapPickerOpen,
    setIsMapPickerOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    selectedProduct,
    setSelectedProduct,
    detailQty,
    setDetailQty,
    detailComment,
    setDetailComment,
    openProductDetail,
    closeProductDetail,
    mpReturnModal,
    setMpReturnModal,
    isAnyModalOpen,
  };
}
