"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { CartItem } from "@/components/modals/CartModal";
import { Product } from "@/components/home/ProductCard";
import { StoreInfo } from "./useCatalog";
import { formatMoney } from "@/lib/formatters";
import { buildOrderWhatsAppMessage } from "@/lib/whatsapp";

export function useOrderSubmission(
  storeInfo: StoreInfo,
  cart: CartItem[],
  cartSubtotal: number,
  products: Product[],
  customerName: string,
  customerPhone: string,
  customerStreet: string,
  customerStreetNumber: string,
  customerAddressDetails: string,
  onOrderSuccess: () => void,
  setMpReturnModal: (modalData: any) => void
) {
  const { isSignedIn, user } = useUser();

  const [deliveryType, setDeliveryType] = useState<"envio" | "retiro">("envio");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "mercadopago">("efectivo");
  const [cashChangeOption, setCashChangeOption] = useState<"exact" | "change">("exact");
  const [cashAmountGiven, setCashAmountGiven] = useState<string>("");
  const [pickupCode, setPickupCode] = useState<string>(() => Math.floor(1000 + Math.random() * 9000).toString());

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    street?: string;
    streetNumber?: string;
    address?: string;
    cashAmount?: string;
  }>({});
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [copiedMpLink, setCopiedMpLink] = useState(false);
  const [mpStep, setMpStep] = useState<"initial" | "opened">("initial");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const streetInputRef = useRef<HTMLInputElement>(null);
  const streetNumberInputRef = useRef<HTMLInputElement>(null);
  const cashAmountInputRef = useRef<HTMLInputElement>(null);

  // Handle Mercado Pago redirect callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const orderIdParam = params.get("orderId");
    const paymentIdParam = params.get("payment_id") || params.get("collection_id");
    const collectionStatusParam = params.get("collection_status") || params.get("status");

    if (paymentStatus) {
      onOrderSuccess();

      if (paymentStatus === "failure" || collectionStatusParam === "rejected" || collectionStatusParam === "cancelled") {
        setMpReturnModal({
          isOpen: true,
          status: "failure",
          order: null,
          copied: false,
        });
        window.history.replaceState({}, "", window.location.pathname);
      } else if (orderIdParam) {
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
          .then(() => {
            // Disparar evento para que useCustomerOrderTracker notifique inmediatamente
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("kiosco_order_updated", { detail: { orderId: orderIdParam } }));
            }
            fetch(`/api/orders/check?id=${orderIdParam}`)
              .then((r) => r.json())
              .then((d) => {
                setMpReturnModal({
                  isOpen: true,
                  status: paymentStatus === "pending" ? "pending" : "success",
                  order: d.success && d.order ? d.order : { id: orderIdParam, total: 0, items: [] },
                  copied: false,
                });
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
  }, []);

  const deliveryCost = deliveryType === "envio" ? (storeInfo.deliveryPrice ?? 1000) : 0;
  const cartTotal = cartSubtotal + deliveryCost;

  const [mpPaymentUrl, setMpPaymentUrl] = useState<string>("");
  const [createdOrderId, setCreatedOrderId] = useState<string>("");

  const handleOpenMercadoPago = async () => {
    // 1. Validar stock antes de crear preferencia
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
    } = {};

    if (!customerName.trim()) {
      newErrors.name = "⚠️ Ingresá tu nombre completo.";
    }

    const phoneDigits = customerPhone.replace(/\D/g, "");
    if (!customerPhone.trim() || phoneDigits.length < 8) {
      newErrors.phone = "⚠️ Ingresá un teléfono válido (mínimo 8 dígitos).";
    }

    if (deliveryType === "envio") {
      if (!customerStreet.trim()) {
        newErrors.street = "⚠️ Ingresá la calle de entrega.";
      }
      if (!customerStreetNumber.trim()) {
        newErrors.streetNumber = "⚠️ Ingresá la altura / número.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      if (newErrors.name) nameInputRef.current?.focus();
      else if (newErrors.phone) phoneInputRef.current?.focus();
      else if (newErrors.street) streetInputRef.current?.focus();
      else if (newErrors.streetNumber) streetNumberInputRef.current?.focus();
      return;
    }

    setFormErrors({});

    const fullAddress =
      deliveryType === "envio"
        ? customerStreetNumber.trim()
          ? `${customerStreet.trim()} ${customerStreetNumber.trim()}${
              customerAddressDetails.trim() ? " (" + customerAddressDetails.trim() + ")" : ""
            }`
          : customerStreet.trim()
        : `Retiro en local (Código: #${pickupCode})`;

    setIsSubmittingOrder(true);
    try {
      const res = await fetch("/api/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          customerName,
          customerPhone,
          customerAddress: fullAddress,
          deliveryType,
          deliveryCost,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || "No se pudo generar el link de pago de Mercado Pago.");
        return;
      }

      const checkoutUrl = data.init_point || data.sandbox_init_point;
      setMpPaymentUrl(checkoutUrl);
      setCreatedOrderId(data.orderId);

      // Guardar orden activa en localStorage para rastreo en tiempo real
      const orderRecord = {
        id: data.orderId,
        customerName,
        customerPhone,
        customerAddress: fullAddress,
        deliveryType,
        total: cartTotal,
        status: "iniciado",
        paymentMethod: "mercadopago",
        items: cart,
        createdAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem("kiosco_last_order", JSON.stringify(orderRecord));
        const existing = JSON.parse(localStorage.getItem("kiosco_active_orders") || "[]");
        const updated = [orderRecord, ...existing.filter((o: any) => o.id !== data.orderId)].slice(0, 10);
        localStorage.setItem("kiosco_active_orders", JSON.stringify(updated));
      } catch (e) {}

      // Abrir checkout oficial de Mercado Pago
      const win = window.open(checkoutUrl, "_blank");
      if (!win) {
        window.location.href = checkoutUrl;
      }
      setMpStep("opened");
    } catch (e: any) {
      console.error("Error al crear preferencia MP:", e);
      alert("Error de conexión al generar el pago de Mercado Pago.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleFinalizeOrder = async () => {
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
      cashAmount?: string;
    } = {};

    if (!customerName.trim()) {
      newErrors.name = "⚠️ Ingresá tu nombre completo.";
    }

    const phoneDigits = customerPhone.replace(/\D/g, "");
    if (!customerPhone.trim() || phoneDigits.length < 8) {
      newErrors.phone = "⚠️ Ingresá un teléfono válido (mínimo 8 dígitos).";
    }

    if (deliveryType === "envio") {
      if (!customerStreet.trim()) {
        newErrors.street = "⚠️ Ingresá la calle de entrega.";
      }
      if (!customerStreetNumber.trim()) {
        newErrors.streetNumber = "⚠️ Ingresá la altura / número.";
      }

      const numCashGiven = parseFloat(cashAmountGiven.replace(/[^0-9.]/g, "")) || 0;
      if (paymentMethod === "efectivo" && cashChangeOption === "change") {
        if (!cashAmountGiven.trim() || numCashGiven <= 0) {
          newErrors.cashAmount = "⚠️ Ingresá con cuánto vas a pagar.";
        } else if (numCashGiven < cartTotal) {
          newErrors.cashAmount = `⚠️ El monto ($${formatMoney(numCashGiven)}) debe ser mayor o igual al total ($${formatMoney(cartTotal)}).`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      if (newErrors.name) nameInputRef.current?.focus();
      else if (newErrors.phone) phoneInputRef.current?.focus();
      else if (newErrors.street) streetInputRef.current?.focus();
      else if (newErrors.streetNumber) streetNumberInputRef.current?.focus();
      else if (newErrors.cashAmount) cashAmountInputRef.current?.focus();
      return;
    }

    setFormErrors({});

    const currentPickupCode = pickupCode || Math.floor(1000 + Math.random() * 9000).toString();
    if (!pickupCode) setPickupCode(currentPickupCode);

    const fullAddress =
      deliveryType === "envio"
        ? customerStreetNumber.trim()
          ? `${customerStreet.trim()} ${customerStreetNumber.trim()}${
              customerAddressDetails.trim() ? " (" + customerAddressDetails.trim() + ")" : ""
            }`
          : customerStreet.trim()
        : `Retiro en local (Código: #${currentPickupCode})`;

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
          paymentMethod: deliveryType === "retiro" ? "retiro" : paymentMethod,
          transferRef: deliveryType === "retiro" ? currentPickupCode : undefined,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert(orderData.message || "No se pudo procesar el pedido. Comprobá el stock disponible.");
        return;
      }

      // Guardar pedido activo en localStorage para rastreo en tiempo real
      const orderRecord = {
        id: orderData.orderId,
        customerName,
        customerPhone,
        customerAddress: fullAddress,
        deliveryType,
        total: cartTotal,
        status: "pendiente",
        paymentMethod: deliveryType === "retiro" ? "retiro" : paymentMethod,
        items: cart,
        createdAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem("kiosco_last_order", JSON.stringify(orderRecord));
        const existing = JSON.parse(localStorage.getItem("kiosco_active_orders") || "[]");
        const updated = [orderRecord, ...existing.filter((o: any) => o.id !== orderData.orderId)].slice(0, 10);
        localStorage.setItem("kiosco_active_orders", JSON.stringify(updated));
      } catch (e) {}

      const msg = buildOrderWhatsAppMessage(
        {
          orderId: orderData.orderId,
          customerName,
          customerPhone,
          deliveryType,
          customerAddress: fullAddress,
          paymentMethod,
          items: cart,
          total: cartTotal,
          deliveryCost,
          cashAmountGiven,
          cashChangeOption,
          pickupCode: currentPickupCode,
        },
        storeInfo.name,
        storeInfo.address
      );

      const cleanNum = (storeInfo.whatsapp || "+5491172570867").replace(/[^\d]/g, "");
      const wspUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`;

      onOrderSuccess();
      window.location.href = wspUrl;
    } catch (e: any) {
      console.error("Order registration error:", e);
      alert("Error de conexión al procesar el pedido.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return {
    deliveryType,
    setDeliveryType,
    paymentMethod,
    setPaymentMethod,
    cashChangeOption,
    setCashChangeOption,
    cashAmountGiven,
    setCashAmountGiven,
    pickupCode,
    formErrors,
    isSubmittingOrder,
    copiedMpLink,
    setCopiedMpLink,
    mpStep,
    mpPaymentUrl,
    createdOrderId,
    deliveryCost,
    cartTotal,
    nameInputRef,
    phoneInputRef,
    streetInputRef,
    streetNumberInputRef,
    cashAmountInputRef,
    handleOpenMercadoPago,
    handleFinalizeOrder,
  };
}
