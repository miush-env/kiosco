"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";

interface Category {
  id: string;
  name: string;
  icon?: string;
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
  availableStock?: number;
}

interface StoreInfo {
  name: string;
  tagline?: string;
  address?: string;
  whatsapp?: string;
  currencySymbol?: string;
  deliveryPrice?: number;
  deliveryFree?: boolean;
}

interface CartItem {
  id: number;
  cartId: string;
  name: string;
  price: number;
  quantity: number;
  comment?: string;
  image?: string | null;
  linkedInventoryId?: string;
  availableStock?: number;
}

function formatMoney(amount: number | string): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-AR");
}

export default function CustomerCatalogPage() {
  const { isSignedIn, user } = useUser();
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;

  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: "Alakary",
    tagline: "Menú Digital & Pedidos Online",
    address: "Paderewski 366",
    whatsapp: "+5491172570867",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailQty, setDetailQty] = useState<number>(1);
  const [detailComment, setDetailComment] = useState<string>("");

  // Cart & Checkout Modals
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  // Mercado Pago Payment Return Modal
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

  // Order Details (Auto-completed from saved profile)
  const [deliveryType, setDeliveryType] = useState<"envio" | "retiro">("envio");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "mercadopago">("mercadopago");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerStreet, setCustomerStreet] = useState("");
  const [customerStreetNumber, setCustomerStreetNumber] = useState("");
  const [customerAddressDetails, setCustomerAddressDetails] = useState("");
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    street?: string;
    streetNumber?: string;
    address?: string;
  }>({});
  const [isProcessingMP, setIsProcessingMP] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Refs for auto-focusing erroneous inputs
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const phoneInputRef = React.useRef<HTMLInputElement>(null);
  const streetInputRef = React.useRef<HTMLInputElement>(null);
  const streetNumberInputRef = React.useRef<HTMLInputElement>(null);
  const addressInputRef = React.useRef<HTMLInputElement>(null);

  // Lock background body scroll whenever any modal / sheet is open
  const isAnyModalOpen = Boolean(
    selectedProduct || isCartOpen || isCheckoutOpen || isProfileOpen || mpReturnModal.isOpen
  );

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


  // Helper to persist customer profile for instant autocompletion
  const updateCustomerProfile = (
    name: string,
    phone: string,
    street: string,
    streetNumber: string,
    details?: string
  ) => {
    try {
      const full = streetNumber
        ? `${street.trim()} ${streetNumber.trim()}${details?.trim() ? " (" + details.trim() + ")" : ""}`
        : street.trim();
      localStorage.setItem(
        "kiosco_customer_profile_v1",
        JSON.stringify({
          name,
          phone,
          address: full,
          street,
          streetNumber,
          details: details || "",
        })
      );
    } catch (e) {}
  };

  // 1. Load cart, customer profile, and cached catalog from localStorage on mount (Instant Render)
  useEffect(() => {
    try {
      // Cart persistence
      const savedCart = localStorage.getItem("kiosco_cart_v1");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }

      // Customer profile auto-load
      const savedProfile = localStorage.getItem("kiosco_customer_profile_v1");
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        if (profile.name) setCustomerName(profile.name);
        if (profile.phone) setCustomerPhone(profile.phone);
        if (profile.street) setCustomerStreet(profile.street);
        if (profile.streetNumber) setCustomerStreetNumber(profile.streetNumber);
        if (profile.details) setCustomerAddressDetails(profile.details);
        if (profile.address && !profile.street) {
          setCustomerStreet(profile.address);
        }
      }

      // Catalog instant cache
      const cachedCatalog = localStorage.getItem("kiosco_catalog_cache_v1");
      if (cachedCatalog) {
        const parsed = JSON.parse(cachedCatalog);
        if (parsed.storeInfo) setStoreInfo(parsed.storeInfo);
        if (parsed.categories && parsed.categories.length > 0) setCategories(parsed.categories);
        if (parsed.products && parsed.products.length > 0) {
          setProducts(parsed.products);
          setLoading(false);
        }
      }
      // Check for Mercado Pago return query params
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const paymentStatus = params.get("payment");
        const orderIdParam = params.get("orderId");
        const paymentIdParam = params.get("payment_id") || params.get("collection_id");
        const collectionStatusParam = params.get("collection_status") || params.get("status");

        if (paymentStatus) {
          // Clear active cart since checkout was initiated
          setCart([]);
          try {
            localStorage.removeItem("kiosco_cart_v1");
          } catch (e) {}

          if (paymentStatus === "failure" || collectionStatusParam === "rejected" || collectionStatusParam === "cancelled") {
            setMpReturnModal({
              isOpen: true,
              status: "failure",
              order: null,
              copied: false,
            });
            window.history.replaceState({}, "", window.location.pathname);
          } else if (orderIdParam) {
            // Confirm and verify payment with backend
            fetch("/api/orders/confirm-mp-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderIdParam,
                paymentId: paymentIdParam,
                collectionStatus: collectionStatusParam || "approved",
              }),
            })
              .then((r) => r.json())
              .then((confirmData) => {
                fetch(`/api/orders/check?id=${orderIdParam}`)
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.success && d.order) {
                      setMpReturnModal({
                        isOpen: true,
                        status: paymentStatus === "pending" ? "pending" : "success",
                        order: d.order,
                        copied: false,
                      });
                    } else {
                      setMpReturnModal({
                        isOpen: true,
                        status: paymentStatus === "pending" ? "pending" : "success",
                        order: { id: orderIdParam, total: 0, items: [] },
                        copied: false,
                      });
                    }
                  })
                  .catch(() => {
                    setMpReturnModal({
                      isOpen: true,
                      status: paymentStatus === "pending" ? "pending" : "success",
                      order: { id: orderIdParam, total: 0, items: [] },
                      copied: false,
                    });
                  });
              })
              .catch(() => {})
              .finally(() => {
                window.history.replaceState({}, "", window.location.pathname);
              });
          }
        }
      }
    } catch (e) {
      console.error("[Storage init error]", e);
    } finally {
      setIsCartLoaded(true);
    }
  }, []);

  // Helper to build WhatsApp message for Mercado Pago order
  const buildMPWhatsAppMessage = (order: any) => {
    if (!order) return "";
    let msg = `🍕 *PEDIDO PAGADO POR MERCADO PAGO — ${storeInfo.name}*\n\n`;
    if (order.id) {
      msg += `🆔 *Pedido:* #${order.id.slice(-6).toUpperCase()}\n`;
    }
    if (order.customerName) msg += `👤 *Cliente:* ${order.customerName}\n`;
    if (order.customerPhone) msg += `📱 *Teléfono:* ${order.customerPhone}\n`;
    msg += `📍 *Modalidad:* ${order.deliveryType === "retiro" ? "Retiro en Local" : "Envío a Domicilio"}\n`;
    if (order.customerAddress && order.deliveryType !== "retiro") {
      msg += `🏠 *Dirección:* ${order.customerAddress}\n`;
    }
    msg += `💳 *Medio de pago:* Mercado Pago (Acreditado / Pagado Online ✅)\n`;
    msg += `\n*Detalle del pedido:*\n`;

    (order.items || []).forEach((item: any) => {
      const q = item.quantity || 1;
      const p = item.price || 0;
      msg += `• *${q}x* ${item.name || "Producto"} — $${formatMoney(p * q)}\n`;
      if (item.comment) msg += `  _(Nota: ${item.comment})_\n`;
    });

    if (order.total) {
      msg += `\n💰 *TOTAL PAGADO:* $${formatMoney(order.total)}\n`;
    }
    msg += `\n✅ _¡Ya realicé el pago por Mercado Pago! Envío este mensaje para confirmar mi pedido y comenzar la preparación._`;
    return msg;
  };

  const getMPWhatsAppUrl = (order: any) => {
    const cleanNum = (storeInfo.whatsapp || "+5491172570867").replace(/[^\d]/g, "");
    const msg = buildMPWhatsAppMessage(order);
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`;
  };

  // 2. Persist cart to localStorage on change
  useEffect(() => {
    if (!isCartLoaded) return;
    try {
      localStorage.setItem("kiosco_cart_v1", JSON.stringify(cart));
    } catch (e) {
      console.error("[Cart save error]", e);
    }
  }, [cart, isCartLoaded]);

  // 3. Fetch latest menu data in background (SWR pattern)
  useEffect(() => {
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
  }, []);


  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat =
        selectedCategory === "all" || prod.categoryId === selectedCategory;

      if (!searchQuery.trim()) return matchCat;

      const q = searchQuery.toLowerCase();
      const matchName = (prod.name || "").toLowerCase().includes(q);
      const matchDesc = (prod.description || "").toLowerCase().includes(q);
      const matchIngredients = (prod.ingredients || []).some((ing) =>
        String(ing).toLowerCase().includes(q)
      );

      return matchCat && (matchName || matchDesc || matchIngredients);
    });
  }, [products, selectedCategory, searchQuery]);

  // Suggestions (Featured)
  const suggestions = useMemo(() => {
    return products.filter((p) => p.badge || Number(p.rating || 0) >= 4.9).slice(0, 4);
  }, [products]);

  // Visible Categories: Only show "all" and categories that have at least 1 active product
  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (cat.id === "all") return true;
      const count = products.filter(
        (p) => String(p.categoryId).trim().toLowerCase() === String(cat.id).trim().toLowerCase()
      ).length;
      return count > 0;
    });
  }, [categories, products]);

  // Auto-reset category selection to "all" if selected category becomes empty/hidden
  useEffect(() => {
    if (
      selectedCategory !== "all" &&
      !visibleCategories.some((c) => c.id === selectedCategory)
    ) {
      setSelectedCategory("all");
      setCurrentPage(1);
    }
  }, [visibleCategories, selectedCategory]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Cart Totals
  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const deliveryCost = deliveryType === "envio" ? (storeInfo.deliveryPrice || 0) : 0;
  const cartTotal = cartSubtotal + deliveryCost;

  // Open detail modal
  const openProductModal = (product: Product) => {
    const latestProduct = products.find((p) => Number(p.id) === Number(product.id)) || product;
    setSelectedProduct(latestProduct);
    const inCart = cart
      .filter((i) => Number(i.id) === Number(latestProduct.id))
      .reduce((s, i) => s + i.quantity, 0);
    const remaining =
      latestProduct.availableStock !== undefined
        ? Math.max(0, latestProduct.availableStock - inCart)
        : 999;
    setDetailQty(remaining > 0 ? 1 : 0);
    setDetailComment("");
  };

  // Add to cart from detail modal
  const addProductFromDetail = () => {
    if (!selectedProduct) return;
    const latestProduct = products.find((p) => Number(p.id) === Number(selectedProduct.id)) || selectedProduct;
    const inCart = cart
      .filter((i) => Number(i.id) === Number(latestProduct.id))
      .reduce((s, i) => s + i.quantity, 0);
    const cap = latestProduct.availableStock;
    const maxCanAdd = cap !== undefined ? Math.max(0, cap - inCart) : 999;

    if (maxCanAdd <= 0) {
      alert(`No podés agregar más porciones de "${latestProduct.name}". Ya tenés todo el stock disponible en tu carrito (${cap || 0}).`);
      return;
    }

    const qtyToAdd = Math.min(detailQty, maxCanAdd);
    if (qtyToAdd <= 0) return;

    const cartId = `${latestProduct.id}_${detailComment.trim() || "none"}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + qtyToAdd } : item
        );
      }
      return [
        ...prev,
        {
          id: latestProduct.id,
          cartId: cartId,
          name: latestProduct.name,
          price: latestProduct.price,
          quantity: qtyToAdd,
          comment: detailComment.trim() || undefined,
          image: latestProduct.image,
          linkedInventoryId: latestProduct.linkedInventoryId,
          availableStock: cap,
        },
      ];
    });
    setSelectedProduct(null);
  };

  // Update item qty in cart
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

  // Clear cart
  const clearCartAll = () => {
    if (confirm("¿Vaciar todo el pedido?")) {
      setCart([]);
      setIsCartOpen(false);
      setIsCheckoutOpen(false);
    }
  };

  // Checkout order
  const handleFinalizeOrder = async () => {
    // 0. Pre-validate stock for all cart items
    for (const item of cart) {
      const prod = products.find((p) => Number(p.id) === Number(item.id));
      if (prod && prod.availableStock !== undefined) {
        const totalInCart = cart
          .filter((i) => Number(i.id) === Number(item.id))
          .reduce((sum, i) => sum + i.quantity, 0);

        if (totalInCart > prod.availableStock) {
          alert(`Stock insuficiente: Solo hay ${prod.availableStock} ${prod.availableStock === 1 ? "porción disponible" : "porciones disponibles"} de "${item.name}". Por favor ajustá la cantidad en tu carrito.`);
          return;
        }
      }
    }

    const newErrors: {
      name?: string;
      phone?: string;
      street?: string;
      streetNumber?: string;
      address?: string;
    } = {};

    if (!customerName.trim()) {
      newErrors.name = "Por favor ingresá tu nombre completo.";
    }

    if (!customerPhone.trim()) {
      newErrors.phone = "Por favor ingresá tu teléfono / WhatsApp de contacto.";
    }

    if (deliveryType === "envio") {
      if (!customerStreet.trim()) {
        newErrors.street = "Por favor ingresá la calle de entrega.";
      }
      if (!customerStreetNumber.trim()) {
        newErrors.streetNumber = "Por favor ingresá la altura / número.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      if (newErrors.name) {
        nameInputRef.current?.focus();
      } else if (newErrors.phone) {
        phoneInputRef.current?.focus();
      } else if (newErrors.street) {
        streetInputRef.current?.focus();
      } else if (newErrors.streetNumber) {
        streetNumberInputRef.current?.focus();
      }
      return;
    }

    // Clear errors if all valid
    setFormErrors({});

    const fullAddress =
      deliveryType === "envio"
        ? customerStreetNumber.trim()
          ? `${customerStreet.trim()} ${customerStreetNumber.trim()}${
              customerAddressDetails.trim() ? " (" + customerAddressDetails.trim() + ")" : ""
            }`
          : customerStreet.trim()
        : "Retiro en local";

    if (paymentMethod === "mercadopago") {
      setIsProcessingMP(true);
      try {
        const res = await fetch("/api/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart,
            customerName,
            customerPhone,
            customerAddress: fullAddress,
          }),
        });
        const data = await res.json();
        if (data.init_point) {
          setCart([]);
          setIsCheckoutOpen(false);
          window.location.href = data.init_point;
          return;
        } else {
          alert(data.error || "No se pudo generar el pago con Mercado Pago.");
        }
      } catch (e: any) {
        alert("Error al conectar con Mercado Pago: " + e.message);
      } finally {
        setIsProcessingMP(false);
      }
      return;
    }

    // Handle Cash Payment (Deduct stock on submit and redirect out to WhatsApp)
    setIsSubmittingOrder(true);
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          customerName,
          customerPhone,
          customerAddress: fullAddress,
          deliveryType,
          total: cartTotal,
          paymentMethod: "efectivo",
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert(orderData.message || "No se pudo procesar el pedido. Comprobá el stock disponible.");
        return;
      }

      // Format WhatsApp message for Cash
      let msg = `🍕 *NUEVO PEDIDO — ${storeInfo.name}*\n\n`;
      if (orderData.orderId) {
        msg += `🆔 *Pedido:* #${orderData.orderId.slice(-6).toUpperCase()}\n`;
      }
      msg += `👤 *Cliente:* ${customerName}\n`;
      if (customerPhone) msg += `📱 *Teléfono:* ${customerPhone}\n`;
      msg += `📍 *Modalidad:* ${deliveryType === "envio" ? "Envío a Domicilio" : "Retiro en Local"}\n`;
      if (deliveryType === "envio") {
        msg += `🏠 *Dirección:* ${fullAddress}\n`;
      }
      msg += `💳 *Medio de pago:* Efectivo (Pago contra entrega)\n`;
      msg += `\n*Detalle del pedido:*\n`;

      cart.forEach((item) => {
        msg += `• *${item.quantity}x* ${item.name} — $${formatMoney(item.price * item.quantity)}\n`;
        if (item.comment) msg += `  _(Nota: ${item.comment})_\n`;
      });

      if (deliveryCost > 0) {
        msg += `\n🛵 *Envío:* $${formatMoney(deliveryCost)}\n`;
      } else {
        msg += `\n🛵 *Envío:* ¡Gratis!\n`;
      }
      msg += `\n💰 *TOTAL:* $${formatMoney(cartTotal)}\n`;

      const cleanNum = (storeInfo.whatsapp || "+5491172570867").replace(/[^\d]/g, "");
      const wspUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`;

      // Clear cart and close checkout modal
      setCart([]);
      try {
        localStorage.removeItem("kiosco_cart_v1");
      } catch (e) {}
      setIsCheckoutOpen(false);

      // Immediate catalog refresh with updated stock in background
      fetch("/api/products")
        .then((res) => res.json())
        .then((data) => {
          if (data.products) setProducts(data.products);
        })
        .catch(() => {});

      // Redirect customer out of page into WhatsApp directly
      window.location.href = wspUrl;
    } catch (e: any) {
      console.error("Cash order registration error:", e);
      alert("Error de conexión al procesar el pedido.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="b1-app-wrapper">
      {/* ── 1. TOPBAR ───────────────────────────────────────────────────────── */}
      <header className="b1-topbar">
        <a href="/" className="b1-topbar-brand">
          <img
            src="/assets/images/logo.png"
            alt={storeInfo.name}
            className="b1-topbar-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100";
            }}
          />
          <div className="b1-topbar-info">
            <h1>{storeInfo.name}</h1>
            <div className="b1-status-pill">
              <span className="b1-status-dot"></span>
              <span>Abierto • Pedidos Online</span>
            </div>
          </div>
        </a>

        <div className="b1-topbar-actions">
          {/* My saved delivery details button */}
          <button
            type="button"
            className="b1-icon-btn"
            onClick={() => setIsProfileOpen(true)}
            title="Mis datos de entrega"
            style={{ position: "relative" }}
          >
            <i className="fas fa-id-card"></i>
            {customerName && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "var(--b1-color-success)",
                  border: "2px solid #fff",
                }}
              ></span>
            )}
          </button>

          {/* Admin panel link if logged in as admin/owner */}
          {isSignedIn && (role === "admin" || role === "owner") && (
            <Link
              href="/panel"
              className="b1-icon-btn"
              title="Panel de Administración"
            >
              <i className="fas fa-sliders-h"></i>
            </Link>
          )}

          {/* Cart trigger button */}
          <button
            type="button"
            className="b1-icon-btn primary"
            onClick={() => setIsCartOpen(true)}
            title="Ver carrito"
          >
            <i className="fas fa-shopping-bag"></i>
            {cartItemCount > 0 && (
              <span className="b1-btn-badge">{cartItemCount}</span>
            )}
          </button>

          {/* User / Sign In */}
          <div style={{ marginLeft: 4 }}>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="b1-icon-btn" title="Iniciar sesión">
                  <i className="fas fa-user"></i>
                </button>
              </SignInButton>
            ) : (
              <UserButton />
            )}
          </div>
        </div>
      </header>

      {/* ── 2. GREETING & HERO BANNER ────────────────────────────────────────── */}
      <section className="b1-greeting-section">
        <div style={{ display: "inline-block", background: "#FFE8D6", color: "var(--b1-color-primary)", padding: "4px 10px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
          ¡Hola! 👋 Pedí Online
        </div>
        <h1 className="b1-greeting-title" style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 6px", color: "var(--b1-color-text-main)", lineHeight: 1.25 }}>
          Alakary — Menú Digital, Pizzas y Delivery Online
        </h1>
        <p className="b1-greeting-subtitle" style={{ fontSize: "14px", margin: "0 0 14px", color: "var(--b1-color-text-muted)" }}>
          Pizzas artesanales, empanadas, minutas y especialidades con delivery rápido y promos exclusivas.
        </p>

        <div className="b1-banner-video-container">
          <video
            id="bannerHeroVideo"
            src="/assets/images/banner.mp4"
            poster="/assets/images/banner.jpg"
            autoPlay
            loop
            muted
            playsInline
            className="b1-banner-video"
            onError={(e) => {
              // Fallback to static banner image if video fails to play
              const target = e.target as HTMLElement;
              const parent = target.parentElement;
              if (parent) {
                target.style.display = "none";
                const img = document.createElement("img");
                img.src = "/assets/images/banner.jpg";
                img.alt = "Alakary - Especialidades de la casa";
                img.className = "b1-banner-video";
                parent.appendChild(img);
              }
            }}
          />
        </div>
      </section>

      {/* ── 3. SEARCH BAR ───────────────────────────────────────────────────── */}
      <section className="b1-search-container">
        <div className="b1-search-box">
          <i className="fas fa-search b1-search-icon"></i>
          <input
            type="text"
            id="appSearchInput"
            className="b1-search-input"
            placeholder="Buscar por plato o ingrediente (ej: cheddar, muzzarella)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              style={{
                border: "none",
                background: "transparent",
                color: "var(--b1-color-text-muted)",
                cursor: "pointer",
                padding: "0 6px",
              }}
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
      </section>

      {/* ── 4. CATEGORIES HORIZONTAL PILLS ──────────────────────────────────── */}
      {visibleCategories.length > 0 && (
        <section className="b1-categories-wrapper">
          <div className="b1-categories-scroll">
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`b1-category-pill ${selectedCategory === cat.id ? "active" : ""}`}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
              >
                <span className="b1-category-icon">{cat.icon || "🍽️"}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. SUGGESTIONS GRID ─────────────────────────────────────────────── */}
      {!searchQuery && selectedCategory === "all" && suggestions.length > 0 && (
        <section id="suggestionsSection">
          <div className="b1-suggestions-header">
            <h2 className="b1-suggestions-title" style={{ fontSize: "16px", fontWeight: 800 }}>Nuestras sugerencias y destacados</h2>
            <span
              className="b1-suggestions-link"
              onClick={() => setSelectedCategory("all")}
            >
              Ver todo
            </span>
          </div>
          <div className="b1-suggestions-grid">
            {suggestions.map((p) => {
              const isOut = p.availableStock !== undefined && p.availableStock <= 0;
              return (
              <div
                key={p.id}
                className={`b1-suggestion-card ${isOut ? "is-out-of-stock" : ""}`}
                onClick={() => openProductModal(p)}
              >
                <div className="b1-sugg-img-wrapper">
                  <img
                    src={p.image || "/assets/images/logo.png"}
                    alt={`${p.name} - Alakary`}
                    loading="lazy"
                    className="b1-sugg-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400";
                    }}
                  />
                  {isOut ? (
                    <span className="b1-card-badge out-of-stock">Agotado</span>
                  ) : (
                    p.badge && <span className="b1-card-badge">{p.badge}</span>
                  )}
                </div>
                <div className="b1-sugg-body">
                  <h3 className="b1-sugg-title">{p.name}</h3>
                  <div className="b1-sugg-footer">
                    <span className="b1-sugg-price">${formatMoney(p.price)}</span>
                    <div className="b1-sugg-rating">
                      <i className="fas fa-star"></i>
                      <span>{p.rating || "4.8"}</span>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 6. ALL PRODUCTS LIST ────────────────────────────────────────────── */}
      <section className="b1-section-header" id="allProductsSectionHeader">
        <h2 className="b1-section-title" style={{ fontSize: "16px", fontWeight: 800 }}>
          {searchQuery
            ? `Resultados para "${searchQuery}"`
            : selectedCategory === "all"
            ? "Todos los Platos y Especialidades"
            : categories.find((c) => c.id === selectedCategory)?.name || "Platos"}
        </h2>
      </section>

      <main className="b1-products-list" id="dynamicProductsContainer">
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
            <i className="fas fa-search" style={{ fontSize: 32, color: "var(--b1-color-text-muted)", marginBottom: 8, display: "block" }}></i>
            <strong style={{ display: "block", color: "var(--b1-color-text-main)", marginBottom: 4 }}>
              No se encontraron platos
            </strong>
            <span style={{ fontSize: 13, color: "var(--b1-color-text-muted)" }}>
              Probá buscando con otro plato o ingrediente.
            </span>
          </div>
        ) : (
          paginatedProducts.map((p) => {
            const isOut = p.availableStock !== undefined && p.availableStock <= 0;
            return (
              <div
                key={p.id}
                className={`b1-product-row-card ${isOut ? "is-out-of-stock" : ""}`}
                onClick={() => openProductModal(p)}
              >
                <img
                  src={p.image || "/assets/images/logo.png"}
                  alt={`${p.name} - Alakary`}
                  loading="lazy"
                  className="b1-row-thumb"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200";
                  }}
                />
                <div className="b1-row-info">
                  <div className="b1-row-badge-row">
                    {isOut ? (
                      <span className="b1-item-badge out-of-stock">Agotado</span>
                    ) : (
                      p.badge && <span className="b1-item-badge">{p.badge}</span>
                    )}
                  </div>
                  <h3 className="b1-row-title">{p.name}</h3>
                  <p className="b1-row-desc">{p.description}</p>
                  <div className="b1-row-price-row">
                    <span className="b1-row-price">${formatMoney(p.price)}</span>
                    <button
                      type="button"
                      className={`b1-row-add-btn ${isOut ? "disabled" : ""}`}
                      disabled={isOut}
                      onClick={(e) => {
                        e.stopPropagation();
                        openProductModal(p);
                      }}
                      title={isOut ? "Agotado" : "Agregar al pedido"}
                    >
                      <i className={`fas ${isOut ? "fa-ban" : "fa-plus"}`}></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* ── PAGINATION CONTROLS ─────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="b1-pagination-wrapper">
          <button
            type="button"
            className="b1-page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <i className="fas fa-arrow-left"></i> Anterior
          </button>
          <div className="b1-page-indicator">
            Página <strong>{currentPage}</strong> de {totalPages}
          </div>
          <button
            type="button"
            className="b1-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      )}

      {/* ── 7. FOOTER & LOCAL SEO INFO ──────────────────────────────────── */}
      <footer className="b1-footer-agency" style={{ marginTop: "32px", padding: "24px 16px 80px" }}>
        {/* Local Business Information Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "var(--b1-radius-xl)",
            padding: "20px 18px",
            marginBottom: "24px",
            border: "1px solid var(--b1-color-border-light)",
            textAlign: "left",
            boxShadow: "var(--b1-shadow-xs)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <img
              src="/assets/images/logo.png"
              alt="Alakary Logo"
              style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
            />
            <div>
              <strong style={{ fontSize: "16px", color: "var(--b1-color-text-main)", display: "block" }}>
                {storeInfo.name}
              </strong>
              <span style={{ fontSize: "12px", color: "var(--b1-color-success)", fontWeight: 700 }}>
                ● Abierto para Pedidos y Delivery
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "var(--b1-color-text-muted)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <i className="fas fa-map-marker-alt" style={{ color: "var(--b1-color-primary)", marginTop: "3px" }}></i>
              <div>
                <strong style={{ color: "var(--b1-color-text-main)" }}>Dirección:</strong>{" "}
                {storeInfo.address || "Paderewski 366, Buenos Aires, Argentina"}
                <br />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeInfo.address || "Paderewski 366, Buenos Aires")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--b1-color-primary)", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}
                >
                  📍 Ver en Google Maps →
                </a>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-clock" style={{ color: "var(--b1-color-primary)" }}></i>
              <div>
                <strong style={{ color: "var(--b1-color-text-main)" }}>Horarios:</strong> Lunes a Domingo: 11:00 a 14:00 hs y 20:00 a 23:59 hs
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-motorcycle" style={{ color: "var(--b1-color-primary)" }}></i>
              <div>
                <strong style={{ color: "var(--b1-color-text-main)" }}>Modalidades:</strong> Envío a domicilio y Retiro en el local
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fab fa-whatsapp" style={{ color: "#25D366" }}></i>
              <div>
                <strong style={{ color: "var(--b1-color-text-main)" }}>Pedidos por WhatsApp:</strong>{" "}
                <a
                  href={`https://wa.me/${(storeInfo.whatsapp || "+5491172570867").replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#25D366", fontWeight: 700, textDecoration: "none" }}
                >
                  {storeInfo.whatsapp || "+54 9 11 7257-0867"}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="b1-agency-logo-row">
          <img
            src="/assets/images/logo.png"
            alt={storeInfo.name}
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <span>{storeInfo.name}</span>
        </div>
        <p className="b1-agency-tagline">
          {storeInfo.tagline || "Menú Digital & Pedidos Online"}
        </p>
        <a
          href={`https://wa.me/${(storeInfo.whatsapp || "+5491172570867").replace(/[^\d]/g, "")}?text=${encodeURIComponent("¡Hola! Me interesa la app web para mi negocio")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="b1-agency-cta-btn"
        >
          <i className="fab fa-whatsapp"></i> ¿Querés una web como esta? Contactanos
        </a>
      </footer>

      {/* ── 8. FLOATING BOTTOM CART BAR ─────────────────────────────────── */}
      {cartItemCount > 0 && (
        <div className="b1-floating-cart-bar">
          <div className="b1-cart-bar-content" onClick={() => setIsCartOpen(true)}>
            <div className="b1-cart-bar-left">
              <span className="b1-cart-pill-count">
                {cartItemCount} {cartItemCount === 1 ? "Alimento" : "Alimentos"}
              </span>
              <span className="b1-cart-bar-total">${formatMoney(cartTotal)}</span>
            </div>
            <div className="b1-cart-bar-action">
              <span>Ver mi pedido</span>
              <i className="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           MODAL 1: PÁGINA DETALLE DE PRODUCTO
           ══════════════════════════════════════════════════════════════════ */}
      {selectedProduct && (
        <div className="b1-modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div
            className="b1-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: "26px 26px 0 0" }}
          >
            {/* Hero Image */}
            <div className="b1-detail-hero-wrapper">
              <img
                src={selectedProduct.image || "/assets/images/logo.png"}
                alt={selectedProduct.name}
                className="b1-detail-hero-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600";
                }}
              />
              <div className="b1-detail-nav-top">
                <button
                  type="button"
                  className="b1-detail-circle-btn"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Volver"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <button
                  type="button"
                  className="b1-detail-circle-btn"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Cerrar"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Body */}
            {(() => {
              const latestProd = products.find((p) => Number(p.id) === Number(selectedProduct.id)) || selectedProduct;
              const inCartCount = cart.filter((i) => Number(i.id) === Number(latestProd.id)).reduce((s, i) => s + i.quantity, 0);
              const maxStock = latestProd.availableStock;
              const remainingStock = maxStock !== undefined ? Math.max(0, maxStock - inCartCount) : 999;
              const isSoldOut = maxStock !== undefined && maxStock <= 0;
              const isCappedInCart = maxStock !== undefined && remainingStock <= 0 && !isSoldOut;

              return (
                <>
                  <div className="b1-detail-body" style={{ overflowY: "auto", flex: 1, padding: "18px 20px" }}>
                    <h2 className="b1-detail-title">{selectedProduct.name}</h2>
                    <div className="b1-detail-price">${formatMoney(selectedProduct.price)}</div>
                    <p className="b1-detail-desc">{selectedProduct.description}</p>

                    {/* Stock Alert Banners */}
                    {isSoldOut && (
                      <div className="b1-out-of-stock-banner" style={{ background: "#FEE2E2", borderColor: "#FECACA", color: "#991B1B", marginBottom: 14 }}>
                        <i className="fas fa-ban" style={{ color: "#DC2626" }}></i>
                        <span>Agotado: no hay stock de ingredientes suficiente en cocina.</span>
                      </div>
                    )}

                    {isCappedInCart && (
                      <div className="b1-out-of-stock-banner" style={{ background: "#FEF3C7", borderColor: "#FDE68A", color: "#92400E", marginBottom: 14 }}>
                        <i className="fas fa-shopping-basket" style={{ color: "#D97706" }}></i>
                        <span>Ya tenés en tu carrito las {maxStock} {maxStock === 1 ? "porción disponible" : "porciones disponibles"} de este plato.</span>
                      </div>
                    )}

                    {!isSoldOut && !isCappedInCart && maxStock !== undefined && maxStock <= 5 && (
                      <div className="b1-out-of-stock-banner" style={{ background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E", marginBottom: 14 }}>
                        <i className="fas fa-exclamation-triangle" style={{ color: "#B45309" }}></i>
                        <span>¡Quedan solo {remainingStock} {remainingStock === 1 ? "porción disponible" : "porciones disponibles"} para agregar!</span>
                      </div>
                    )}

                    {/* Ingredients */}
                    {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div className="b1-ingredients-title">
                          <i className="fas fa-utensils"></i> Ingredientes incluidos:
                        </div>
                        <div className="b1-ingredients-list">
                          {selectedProduct.ingredients.map((ing, i) => (
                            <span key={i} className="b1-ingredient-chip">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity Stepper */}
                    <div
                      style={{
                        background: "var(--b1-color-surface-subtle)",
                        borderRadius: "var(--b1-radius-lg)",
                        padding: "12px 16px",
                        marginBottom: 14,
                        opacity: isSoldOut || isCappedInCart ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--b1-color-text-muted)",
                            textTransform: "uppercase",
                          }}
                        >
                          Cantidad
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <button
                            type="button"
                            className="b1-step-btn minus"
                            disabled={detailQty <= 1 || isSoldOut || isCappedInCart}
                            onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <span
                            style={{
                              fontSize: 18,
                              fontWeight: 800,
                              minWidth: 24,
                              textAlign: "center",
                            }}
                          >
                            {isSoldOut || isCappedInCart ? 0 : detailQty}
                          </span>
                          <button
                            type="button"
                            className="b1-step-btn plus"
                            disabled={isSoldOut || isCappedInCart || detailQty >= remainingStock}
                            onClick={() =>
                              setDetailQty((q) => Math.min(q + 1, remainingStock))
                            }
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="b1-form-group" style={{ marginBottom: 16 }}>
                      <label className="b1-form-label">
                        <i className="far fa-edit"></i> Aclaraciones (ej: sin cebolla, aderezos aparte)
                      </label>
                      <input
                        type="text"
                        className="b1-input"
                        placeholder="Escribí aquí tu preferencia..."
                        value={detailComment}
                        onChange={(e) => setDetailComment(e.target.value)}
                        disabled={isSoldOut || isCappedInCart}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: "14px 18px", borderTop: "1px solid var(--b1-color-border-light)" }}>
                    <button
                      type="button"
                      className="b1-btn-primary"
                      disabled={isSoldOut || isCappedInCart}
                      onClick={addProductFromDetail}
                    >
                      <span>
                        <i className={`fas ${isSoldOut || isCappedInCart ? "fa-ban" : "fa-plus-circle"}`} style={{ marginRight: 6 }}></i>
                        {isSoldOut
                          ? "Agotado por falta de stock"
                          : isCappedInCart
                          ? `Máximo en carrito (${maxStock})`
                          : "Agregar a mi pedido"}
                      </span>
                      <span>${formatMoney(selectedProduct.price * (isSoldOut || isCappedInCart ? 0 : detailQty))}</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           MODAL 2: CARRITO / MI PEDIDO
           ══════════════════════════════════════════════════════════════════ */}
      {isCartOpen && (
        <div className="b1-modal-backdrop" onClick={() => setIsCartOpen(false)}>
          <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="b1-sheet-drag-handle"></div>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--b1-color-border-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h5 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                <i className="fas fa-shopping-basket" style={{ color: "var(--b1-color-primary)", marginRight: 6 }}></i>
                Mi Pedido
              </h5>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCartAll}
                    className="b1-cart-clear-btn"
                    style={{
                      background: "#FEE2E2",
                      border: "1px solid #FECACA",
                      color: "#DC2626",
                      fontSize: "12px",
                      fontWeight: 700,
                      borderRadius: "8px",
                      padding: "5px 10px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                    }}
                    title="Vaciar todos los productos del carrito"
                  >
                    <i className="fas fa-trash-alt" style={{ color: "#DC2626", fontSize: "12px" }}></i>
                    <span style={{ color: "#DC2626", fontWeight: 700 }}>Vaciar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="b1-modal-close-btn"
                  aria-label="Cerrar carrito"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "var(--b1-color-text-muted)" }}>
                  <i className="fas fa-shopping-bag" style={{ fontSize: 32, marginBottom: 8, display: "block" }}></i>
                  <span>Tu carrito está vacío.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {cart.map((item) => (
                    <div
                      key={item.cartId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        background: "var(--b1-color-surface-subtle)",
                        borderRadius: "var(--b1-radius-md)",
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: 14, color: "var(--b1-color-text-main)", display: "block" }}>
                          {item.name}
                        </strong>
                        {item.comment && (
                          <span style={{ fontSize: 11, color: "var(--b1-color-text-muted)", fontStyle: "italic", display: "block" }}>
                            Nota: {item.comment}
                          </span>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--b1-color-primary)" }}>
                          ${formatMoney(item.price * item.quantity)}
                        </span>
                      </div>

                      {/* Stepper */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          type="button"
                          className="b1-step-btn minus"
                          style={{ width: 28, height: 28, fontSize: 11 }}
                          onClick={() => updateCartQty(item.cartId, -1)}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <span style={{ fontSize: 14, fontWeight: 800, minWidth: 16, textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="b1-step-btn plus"
                          style={{ width: 28, height: 28, fontSize: 11 }}
                          disabled={item.availableStock !== undefined && item.quantity >= item.availableStock}
                          onClick={() => updateCartQty(item.cartId, 1)}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div style={{ padding: "14px 18px", borderTop: "1px solid var(--b1-color-border-light)" }}>
                <button
                  type="button"
                  className="b1-btn-primary"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                >
                  <span>Continuar con mi pedido</span>
                  <span>${formatMoney(cartTotal)}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           MODAL 3: FINALIZAR PEDIDO / CHECKOUT
           ══════════════════════════════════════════════════════════════════ */}
      {isCheckoutOpen && (
        <div className="b1-modal-backdrop" onClick={() => setIsCheckoutOpen(false)}>
          <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="b1-sheet-drag-handle"></div>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--b1-color-border-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h5 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Finalizar Pedido</h5>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="b1-modal-close-btn"
                aria-label="Cerrar modal"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
              {/* Validation Alert Banner */}
              {Object.keys(formErrors).length > 0 && (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1.5px solid #F87171",
                    color: "#991B1B",
                    borderRadius: "14px",
                    padding: "10px 14px",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "14px",
                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.12)",
                    animation: "b1-slide-up 0.2s ease-out",
                  }}
                >
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: 15, color: "#DC2626" }}></i>
                  <span>Por favor completá los campos obligatorios marcados en rojo.</span>
                </div>
              )}

              {/* 1. Forma de entrega */}
              <div className="b1-form-group">
                <label className="b1-form-label">1. Forma de entrega</label>
                <div className="b1-choice-cards">
                  <div
                    className={`b1-choice-card ${deliveryType === "envio" ? "active" : ""}`}
                    onClick={() => {
                      setDeliveryType("envio");
                    }}
                  >
                    <i className="fas fa-motorcycle" style={{ fontSize: 18, marginBottom: 4, display: "block" }}></i>
                    <span>Envío (Gratis)</span>
                  </div>
                  <div
                    className={`b1-choice-card ${deliveryType === "retiro" ? "active" : ""}`}
                    onClick={() => {
                      setDeliveryType("retiro");
                      setFormErrors((prev) => ({ ...prev, address: undefined }));
                    }}
                  >
                    <i className="fas fa-store" style={{ fontSize: 18, marginBottom: 4, display: "block" }}></i>
                    <span>Retiro en Local</span>
                  </div>
                </div>
              </div>

              {/* 2. Datos del cliente (Autocompletados y Editables) */}
              <div className="b1-form-group">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label className="b1-form-label" style={{ margin: 0 }}>2. Tus datos de entrega</label>
                  {(customerName || customerPhone) && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--b1-color-success)",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#ECFDF5",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        border: "1px solid #A7F3D0",
                      }}
                      title="Tus datos quedan guardados y podés modificarlos en cualquier momento"
                    >
                      <i className="fas fa-check-circle" style={{ fontSize: 11 }}></i> Autocompletado
                    </span>
                  )}
                </div>
                
                {/* Nombre */}
                <div style={{ marginBottom: 10 }}>
                  <input
                    ref={nameInputRef}
                    type="text"
                    className="b1-input"
                    placeholder="Nombre completo *"
                    style={{
                      border: formErrors.name ? "1.5px solid #EF4444" : undefined,
                      backgroundColor: formErrors.name ? "#FFF5F5" : undefined,
                      boxShadow: formErrors.name ? "0 0 0 3px rgba(239, 68, 68, 0.15)" : undefined,
                      transition: "all 0.2s ease",
                    }}
                    value={customerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerName(val);
                      updateCustomerProfile(
                        val,
                        customerPhone,
                        customerStreet,
                        customerStreetNumber,
                        customerAddressDetails
                      );
                      if (formErrors.name) {
                        setFormErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                  />
                  {formErrors.name && (
                    <span
                      style={{
                        color: "#DC2626",
                        fontSize: "11px",
                        fontWeight: 700,
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <i className="fas fa-exclamation-circle"></i> {formErrors.name}
                    </span>
                  )}
                </div>

                {/* Teléfono */}
                <div style={{ marginBottom: 10 }}>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    className="b1-input"
                    placeholder="Teléfono / WhatsApp (Obligatorio) *"
                    style={{
                      border: formErrors.phone ? "1.5px solid #EF4444" : undefined,
                      backgroundColor: formErrors.phone ? "#FFF5F5" : undefined,
                      boxShadow: formErrors.phone ? "0 0 0 3px rgba(239, 68, 68, 0.15)" : undefined,
                      transition: "all 0.2s ease",
                    }}
                    value={customerPhone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerPhone(val);
                      updateCustomerProfile(
                        customerName,
                        val,
                        customerStreet,
                        customerStreetNumber,
                        customerAddressDetails
                      );
                      if (formErrors.phone) {
                        setFormErrors((prev) => ({ ...prev, phone: undefined }));
                      }
                    }}
                  />
                  {formErrors.phone && (
                    <span
                      style={{
                        color: "#DC2626",
                        fontSize: "11px",
                        fontWeight: 700,
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <i className="fas fa-exclamation-circle"></i> {formErrors.phone}
                    </span>
                  )}
                </div>

                {/* Dirección de entrega */}
                {deliveryType === "envio" && (
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ marginBottom: 8 }}>
                      <label className="b1-form-label" style={{ margin: 0, fontSize: 12 }}>
                        Dirección de entrega *
                      </label>
                    </div>

                    {/* Calle y Número en la misma fila */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <div style={{ flex: 2.3 }}>
                        <input
                          ref={streetInputRef}
                          type="text"
                          className="b1-input"
                          placeholder="Calle *"
                          style={{
                            background: "#ffffff",
                            border: formErrors.street ? "1.5px solid #EF4444" : undefined,
                            backgroundColor: formErrors.street ? "#FFF5F5" : "#ffffff",
                            boxShadow: formErrors.street ? "0 0 0 3px rgba(239, 68, 68, 0.15)" : undefined,
                          }}
                          value={customerStreet}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomerStreet(val);
                            updateCustomerProfile(
                              customerName,
                              customerPhone,
                              val,
                              customerStreetNumber,
                              customerAddressDetails
                            );
                            if (formErrors.street) setFormErrors((prev) => ({ ...prev, street: undefined }));
                          }}
                        />
                        {formErrors.street && (
                          <span style={{ color: "#DC2626", fontSize: "11px", fontWeight: 700, marginTop: "4px", display: "block" }}>
                            <i className="fas fa-exclamation-circle"></i> {formErrors.street}
                          </span>
                        )}
                      </div>

                      <div style={{ flex: 1.2 }}>
                        <input
                          ref={streetNumberInputRef}
                          type="text"
                          className="b1-input"
                          placeholder="Número *"
                          style={{
                            background: "#ffffff",
                            border: formErrors.streetNumber ? "1.5px solid #EF4444" : undefined,
                            backgroundColor: formErrors.streetNumber ? "#FFF5F5" : "#ffffff",
                            boxShadow: formErrors.streetNumber ? "0 0 0 3px rgba(239, 68, 68, 0.15)" : undefined,
                          }}
                          value={customerStreetNumber}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomerStreetNumber(val);
                            updateCustomerProfile(
                              customerName,
                              customerPhone,
                              customerStreet,
                              val,
                              customerAddressDetails
                            );
                            if (formErrors.streetNumber) setFormErrors((prev) => ({ ...prev, streetNumber: undefined }));
                          }}
                        />
                        {formErrors.streetNumber && (
                          <span style={{ color: "#DC2626", fontSize: "11px", fontWeight: 700, marginTop: "4px", display: "block" }}>
                            <i className="fas fa-exclamation-circle"></i> {formErrors.streetNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Piso / Depto / Nota opcional */}
                    <div>
                      <input
                        type="text"
                        className="b1-input"
                        placeholder="Piso / Depto / Indicaciones de timbre (Opcional)"
                        style={{ background: "#ffffff", fontSize: "12px" }}
                        value={customerAddressDetails}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomerAddressDetails(val);
                          updateCustomerProfile(
                            customerName,
                            customerPhone,
                            customerStreet,
                            customerStreetNumber,
                            val
                          );
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Medio de pago */}
              <div className="b1-form-group">
                <label className="b1-form-label">3. Medio de pago</label>
                <div className="b1-payment-chips">
                  <div
                    className={`b1-payment-chip ${paymentMethod === "mercadopago" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("mercadopago")}
                  >
                    💳 Mercado Pago
                  </div>
                  <div
                    className={`b1-payment-chip ${paymentMethod === "efectivo" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("efectivo")}
                  >
                    💵 Efectivo
                  </div>
                </div>

                {paymentMethod === "mercadopago" && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(0, 158, 227, 0.08) 0%, rgba(0, 158, 227, 0.02) 100%)",
                      border: "1.5px solid rgba(0, 158, 227, 0.3)",
                      borderRadius: "var(--b1-radius-md)",
                      padding: "12px 14px",
                      marginTop: 10,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        background: "#009EE3",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <i className="fas fa-bolt"></i>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#007BB0", marginBottom: 2 }}>
                        Pago instantáneo y 100% seguro
                      </div>
                      <div style={{ fontSize: 12, color: "var(--b1-color-text-main)", lineHeight: 1.4 }}>
                        Acepta <strong>Débito, Crédito, Dinero en cuenta</strong> o <strong>Transferencia bancaria / CVU</strong> desde cualquier banco o billetera virtual.
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "efectivo" && (
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1.5px dashed rgba(16, 185, 129, 0.4)",
                      borderRadius: "var(--b1-radius-md)",
                      padding: "10px 14px",
                      marginTop: 10,
                      fontSize: 12,
                      color: "#065F46",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <i className="fas fa-hand-holding-usd" style={{ fontSize: 15 }}></i>
                    <span>Abonás en efectivo cuando recibís el pedido o al retirar en el local.</span>
                  </div>
                )}
              </div>

              {/* 4. Resumen */}
              <div className="b1-summary-box">
                <div className="b1-summary-row">
                  <span>Subtotal pedido:</span>
                  <strong>${formatMoney(cartSubtotal)}</strong>
                </div>
                <div className="b1-summary-row">
                  <span>Entrega:</span>
                  <strong style={{ color: "var(--b1-color-success)" }}>
                    {deliveryCost === 0 ? "Gratis" : `$${formatMoney(deliveryCost)}`}
                  </strong>
                </div>
                <div className="b1-summary-row total">
                  <span>Total a pagar:</span>
                  <strong style={{ color: "var(--b1-color-primary)", fontSize: 18 }}>
                    ${formatMoney(cartTotal)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Checkout Footer */}
            <div style={{ padding: "14px 18px", borderTop: "1px solid var(--b1-color-border-light)" }}>
              <button
                type="button"
                className="b1-btn-primary"
                disabled={isProcessingMP || isSubmittingOrder}
                onClick={handleFinalizeOrder}
              >
                <span>
                  {paymentMethod === "mercadopago" ? (
                    <>
                      <i className="fas fa-lock" style={{ fontSize: 16, marginRight: 6 }}></i>
                      {isProcessingMP ? "Generando pago..." : "Pagar con Mercado Pago"}
                    </>
                  ) : (
                    <>
                      <i className="fab fa-whatsapp" style={{ fontSize: 18, marginRight: 6 }}></i>
                      {isSubmittingOrder ? "Redirigiendo a WhatsApp..." : "Enviar por WhatsApp"}
                    </>
                  )}
                </span>
                <span>${formatMoney(cartTotal)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: MIS DATOS DE ENTREGA (Customer Profile) ─────────────────── */}
      {isProfileOpen && (
        <div className="b1-modal-backdrop" onClick={() => setIsProfileOpen(false)}>
          <div className="b1-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--b1-color-border-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>👤</span>
                <h5 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Mis Datos de Entrega</h5>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="b1-modal-close-btn"
                aria-label="Cerrar modal"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ padding: "18px 20px" }}>
              <p style={{ fontSize: 13, color: "var(--b1-color-text-muted)", margin: "0 0 16px", lineHeight: 1.4 }}>
                Guardá tus datos para que se <strong>autocompleten automáticamente</strong> en tus pedidos. Podés modificarlos cuando quieras.
              </p>

              {profileSavedFeedback && (
                <div
                  style={{
                    background: "#ECFDF5",
                    border: "1.5px solid #10B981",
                    color: "#065F46",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "14px",
                    animation: "b1-slide-up 0.2s ease-out",
                  }}
                >
                  <i className="fas fa-check-circle" style={{ color: "#059669" }}></i>
                  <span>¡Tus datos fueron guardados con éxito!</span>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label className="b1-form-label" style={{ marginBottom: 4 }}>Nombre completo</label>
                <input
                  type="text"
                  className="b1-input"
                  placeholder="Ej: Lucas Valdez"
                  value={customerName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomerName(val);
                    updateCustomerProfile(
                      val,
                      customerPhone,
                      customerStreet,
                      customerStreetNumber,
                      customerAddressDetails
                    );
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="b1-form-label" style={{ marginBottom: 4 }}>Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  className="b1-input"
                  placeholder="Ej: +54 9 11 1234-5678"
                  value={customerPhone}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomerPhone(val);
                    updateCustomerProfile(
                      customerName,
                      val,
                      customerStreet,
                      customerStreetNumber,
                      customerAddressDetails
                    );
                  }}
                />
              </div>

              {/* Dirección de entrega */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <label className="b1-form-label" style={{ margin: 0, fontSize: 12 }}>
                    Dirección habitual de entrega
                  </label>
                </div>

                {/* Calle y Número */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ flex: 2.3 }}>
                    <input
                      type="text"
                      className="b1-input"
                      placeholder="Calle *"
                      style={{ background: "#ffffff" }}
                      value={customerStreet}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomerStreet(val);
                        updateCustomerProfile(
                          customerName,
                          customerPhone,
                          val,
                          customerStreetNumber,
                          customerAddressDetails
                        );
                      }}
                    />
                  </div>

                  <div style={{ flex: 1.2 }}>
                    <input
                      type="text"
                      className="b1-input"
                      placeholder="Número *"
                      style={{ background: "#ffffff" }}
                      value={customerStreetNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomerStreetNumber(val);
                        updateCustomerProfile(
                          customerName,
                          customerPhone,
                          customerStreet,
                          val,
                          customerAddressDetails
                        );
                      }}
                    />
                  </div>
                </div>

                {/* Piso / Depto */}
                <div>
                  <input
                    type="text"
                    className="b1-input"
                    placeholder="Piso / Depto / Indicaciones (Opcional)"
                    style={{ background: "#ffffff", fontSize: "12px" }}
                    value={customerAddressDetails}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerAddressDetails(val);
                      updateCustomerProfile(
                        customerName,
                        customerPhone,
                        customerStreet,
                        customerStreetNumber,
                        val
                      );
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="b1-btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => {
                    updateCustomerProfile(
                      customerName,
                      customerPhone,
                      customerStreet,
                      customerStreetNumber,
                      customerAddressDetails
                    );
                    setProfileSavedFeedback(true);
                    setTimeout(() => {
                      setProfileSavedFeedback(false);
                      setIsProfileOpen(false);
                    }, 1000);
                  }}
                >
                  <i className="fas fa-save" style={{ marginRight: 6 }}></i> Guardar Mis Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. MERCADO PAGO PAYMENT RETURN MODAL ───────────────────────── */}
      {mpReturnModal.isOpen && (
        <div
          className="b1-modal-backdrop"
          style={{
            zIndex: 99999,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div
            className="b1-modal-card"
            style={{
              maxWidth: 440,
              padding: 0,
              overflow: "hidden",
              borderRadius: 20,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              backgroundColor: "#ffffff",
              background: "#ffffff",
              border: "1px solid #E2E8F0",
            }}
          >
            {/* Header banner */}
            <div
              style={{
                background:
                  mpReturnModal.status === "failure"
                    ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                    : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#ffffff",
                padding: "26px 20px 22px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  fontSize: 30,
                  backdropFilter: "blur(4px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                {mpReturnModal.status === "failure" ? (
                  <i className="fas fa-times" style={{ color: "#fff" }}></i>
                ) : (
                  <i className="fas fa-check" style={{ color: "#fff" }}></i>
                )}
              </div>
              <h2 style={{ fontSize: 21, fontWeight: 900, margin: "0 0 6px", color: "#fff", letterSpacing: "-0.3px" }}>
                {mpReturnModal.status === "failure"
                  ? "Pago No Completado"
                  : mpReturnModal.status === "pending"
                  ? "Pago en Proceso"
                  : "¡Transferencia Exitosa!"}
              </h2>
              <p style={{ fontSize: 13, opacity: 0.95, margin: 0, color: "#fff" }}>
                {mpReturnModal.status === "failure"
                  ? "El pago fue cancelado o rechazado por Mercado Pago."
                  : "Tu pago por Mercado Pago fue acreditado con éxito."}
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px", backgroundColor: "#ffffff" }}>
              {mpReturnModal.status !== "failure" ? (
                <>
                  {/* WhatsApp Instruction Notice */}
                  <div
                    style={{
                      background: "#ECFDF5",
                      border: "1.5px dashed #059669",
                      borderRadius: 14,
                      padding: "12px 14px",
                      marginBottom: 16,
                      fontSize: 13,
                      color: "#065F46",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <i
                      className="fab fa-whatsapp"
                      style={{ fontSize: 24, color: "#059669", marginTop: 2, flexShrink: 0 }}
                    ></i>
                    <div>
                      <strong style={{ display: "block", fontSize: 14, marginBottom: 2 }}>
                        ¡Paso final importante!
                      </strong>
                      Tocá el botón verde abajo para <strong>enviar tu pedido a WhatsApp</strong> al local y comenzar la preparación.
                    </div>
                  </div>

                  {/* Order Summary Box */}
                  {mpReturnModal.order && (
                    <div
                      style={{
                        background: "#F8FAFC",
                        borderRadius: 14,
                        padding: "14px",
                        marginBottom: 16,
                        fontSize: 13,
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                          fontWeight: 800,
                          fontSize: 14,
                        }}
                      >
                        <span>
                          Pedido #{mpReturnModal.order.id ? mpReturnModal.order.id.slice(-6).toUpperCase() : "OK"}
                        </span>
                        <span style={{ color: "#059669", fontWeight: 900, fontSize: 15 }}>
                          ${formatMoney(mpReturnModal.order.total || 0)}
                        </span>
                      </div>

                      {mpReturnModal.order.customerName && (
                        <div style={{ color: "#475569", fontSize: 12, marginBottom: 4 }}>
                          👤 <strong>Cliente:</strong> {mpReturnModal.order.customerName}
                        </div>
                      )}

                      {mpReturnModal.order.deliveryType && (
                        <div style={{ color: "#475569", fontSize: 12, marginBottom: 8 }}>
                          📍 <strong>Modalidad:</strong>{" "}
                          {mpReturnModal.order.deliveryType === "retiro"
                            ? "Retiro en local"
                            : `Envío (${mpReturnModal.order.customerAddress || "A domicilio"})`}
                        </div>
                      )}

                      {/* Item list */}
                      {Array.isArray(mpReturnModal.order.items) && mpReturnModal.order.items.length > 0 && (
                        <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 8 }}>
                          {mpReturnModal.order.items.map((it: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: 12,
                                marginBottom: 2,
                                color: "#334155",
                              }}
                            >
                              <span>
                                {it.quantity || 1}x {it.name || "Producto"}
                                {it.comment && <span style={{ color: "#64748B", fontStyle: "italic", marginLeft: 4 }}>({it.comment})</span>}
                              </span>
                              <span style={{ fontWeight: 600 }}>${formatMoney((it.price || 0) * (it.quantity || 1))}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* WhatsApp Action Button */}
                  <a
                    href={getMPWhatsAppUrl(mpReturnModal.order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setMpReturnModal((prev) => ({ ...prev, isOpen: false }));
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      width: "100%",
                      padding: "14px 18px",
                      background: "#25D366",
                      color: "#fff",
                      borderRadius: 14,
                      fontWeight: 800,
                      fontSize: 15,
                      textDecoration: "none",
                      boxShadow: "0 6px 18px rgba(37, 211, 102, 0.4)",
                      marginBottom: 10,
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  >
                    <i className="fab fa-whatsapp" style={{ fontSize: 20 }}></i>
                    <span>Enviar Pedido a WhatsApp</span>
                  </a>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = buildMPWhatsAppMessage(mpReturnModal.order);
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(text);
                        setMpReturnModal((prev) => ({ ...prev, copied: true }));
                        setTimeout(() => {
                          setMpReturnModal((prev) => ({ ...prev, copied: false }));
                        }, 2500);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#F8FAFC",
                      border: "1px solid #CBD5E1",
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 13,
                      color: "#334155",
                      cursor: "pointer",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <i className={mpReturnModal.copied ? "fas fa-check text-green-600" : "fas fa-copy"}></i>
                    <span>
                      {mpReturnModal.copied ? "¡Copiado al portapapeles! ✅" : "Copiar detalle del pedido"}
                    </span>
                  </button>

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setMpReturnModal((prev) => ({ ...prev, isOpen: false }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "transparent",
                      border: "none",
                      color: "var(--b1-color-text-muted)",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Cerrar y volver al menú
                  </button>
                </>
              ) : (
                <>
                  <div
                    style={{
                      background: "#FEF2F2",
                      border: "1px solid #FCA5A5",
                      borderRadius: 14,
                      padding: "14px",
                      marginBottom: 16,
                      fontSize: 13,
                      color: "#991B1B",
                      textAlign: "center",
                    }}
                  >
                    No se completó la transferencia de Mercado Pago. Podés intentar nuevamente o hacer tu pedido pagando en efectivo al recibirlo.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      type="button"
                      className="b1-btn-primary"
                      style={{ width: "100%", justifyContent: "center", padding: "12px 16px" }}
                      onClick={() => {
                        setMpReturnModal((prev) => ({ ...prev, isOpen: false }));
                        setIsCheckoutOpen(true);
                      }}
                    >
                      <i className="fas fa-redo-alt" style={{ marginRight: 6 }}></i>
                      Intentar de nuevo
                    </button>
                    <button
                      type="button"
                      onClick={() => setMpReturnModal((prev) => ({ ...prev, isOpen: false }))}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: "#F1F5F9",
                        border: "1px solid #CBD5E1",
                        borderRadius: 12,
                        color: "#475569",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Cerrar y volver al menú
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

