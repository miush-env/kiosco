"use client";

import React from "react";
import Link from "next/link";
import { User, LogOut, MapPin, X, ShieldCheck, Crown, CheckCircle2 } from "lucide-react";
import { UserButton, useClerk } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { getUserRole, isUserAdminOrOwner } from "@/lib/auth-client";

interface StoreInfo {
  name: string;
  tagline?: string;
  address?: string;
  whatsapp?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSignedIn: boolean;
  user: any;
  role?: string;
  signOut: (options?: { redirectUrl?: string }) => Promise<void>;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerStreet: string;
  setCustomerStreet: (street: string) => void;
  customerStreetNumber: string;
  setCustomerStreetNumber: (num: string) => void;
  customerAddressDetails: string;
  setCustomerAddressDetails: (details: string) => void;
  updateCustomerProfile: (
    name: string,
    phone: string,
    street: string,
    streetNumber: string,
    details?: string
  ) => void;
  profileSavedFeedback: boolean;
  setProfileSavedFeedback: (saved: boolean) => void;
  storeInfo: StoreInfo;
}

export function ProfileModal({
  isOpen,
  onClose,
  isSignedIn,
  user,
  role,
  signOut,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerStreet,
  setCustomerStreet,
  customerStreetNumber,
  setCustomerStreetNumber,
  customerAddressDetails,
  setCustomerAddressDetails,
  updateCustomerProfile,
  profileSavedFeedback,
  setProfileSavedFeedback,
  storeInfo,
}: ProfileModalProps) {
  const { openSignIn } = useClerk();

  const userRole = getUserRole(user);
  const isUserAdmin = Boolean(isSignedIn && isUserAdminOrOwner(user));

  if (!isOpen) return null;

  const handleOpenSignIn = () => {
    onClose();
    setTimeout(() => {
      openSignIn({
        fallbackRedirectUrl: "/",
        signUpFallbackRedirectUrl: "/",
      });
    }, 50);
  };

  const handleSaveProfile = () => {
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
      onClose();
    }, 1200);
  };

  return (
    <div className="b1-modal-backdrop" onClick={onClose}>
      <div
        className="b1-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 460, borderRadius: "26px 26px 0 0" }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--b1-color-border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--b1-color-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "var(--b1-color-primary-light)",
                color: "var(--b1-color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              <User style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "var(--b1-color-text-main)" }}>
                Mi Cuenta & Entrega
              </h3>
              <span style={{ fontSize: 12, color: "var(--b1-color-text-muted)", fontWeight: 600 }}>
                {isSignedIn ? "Perfil y datos sincronizados" : "Gestioná tus datos y pedidos"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="b1-modal-close-btn"
            aria-label="Cerrar modal"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ padding: "20px 22px", maxHeight: "80vh", overflowY: "auto" }}>
          {/* Account and Auth Session */}
          <div
            style={{
              background: "var(--b1-color-surface-subtle)",
              border: "1.5px solid var(--b1-color-border)",
              borderRadius: "16px",
              padding: "14px 16px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {isSignedIn ? (
                <UserButton />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--b1-color-surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--b1-color-text-muted)",
                    border: "1px solid var(--b1-color-border)",
                    fontSize: 20,
                  }}
                >
                  <User style={{ width: 20, height: 20 }} />
                </div>
              )}
              <div>
                <strong style={{ fontSize: 15, color: "var(--b1-color-text-main)", display: "block" }}>
                  {customerName || user?.fullName || (isSignedIn ? "Mi Cuenta" : "Usuario Invitado")}
                </strong>
                <div style={{ fontSize: 12, color: "var(--b1-color-text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  {isSignedIn ? (
                    userRole === "owner" ? (
                      <>
                        <Crown style={{ width: 14, height: 14, color: "var(--b1-color-primary)" }} />
                        <span style={{ color: "var(--b1-color-primary)", fontWeight: 800 }}>Dueño (Owner)</span>
                      </>
                    ) : isUserAdmin ? (
                      <>
                        <ShieldCheck style={{ width: 14, height: 14, color: "var(--b1-color-primary)" }} />
                        <span style={{ color: "var(--b1-color-primary)", fontWeight: 700 }}>Administrador</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 style={{ width: 14, height: 14, color: "#10B981" }} />
                        <span>Cuenta conectada</span>
                      </>
                    )
                  ) : (
                    <span>Iniciá sesión para guardar en la nube</span>
                  )}
                </div>
              </div>
            </div>

            {isSignedIn ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    localStorage.removeItem("kiosco_customer_profile_v1");
                    setCustomerName("");
                    setCustomerPhone("");
                    await signOut({ redirectUrl: "/" });
                  } catch (err) {
                    console.error("Sign out error", err);
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#DC2626",
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  flexShrink: 0,
                }}
                title="Cerrar sesión actual"
              >
                <LogOut style={{ width: 14, height: 14 }} />
                <span>Cerrar sesión</span>
              </button>
            ) : (
              <Button
                type="button"
                variant="default"
                className="w-auto px-3.5 py-2 text-xs font-bold rounded-xl"
                onClick={handleOpenSignIn}
              >
                Iniciar sesión
              </Button>
            )}
          </div>

          {/* Acceso directo al Panel de Administración si el usuario es Admin/Dueño */}
          {isSignedIn && isUserAdmin && (
            <div style={{ marginBottom: 20 }}>
              <Link
                href="/panel"
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  background: "linear-gradient(135deg, var(--b1-color-primary, #FF5030) 0%, #E03A1B 100%)",
                  color: "#FFFFFF",
                  borderRadius: 16,
                  textDecoration: "none",
                  fontWeight: 800,
                  fontSize: 14,
                  boxShadow: "0 6px 18px rgba(255, 80, 48, 0.35)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ShieldCheck style={{ width: 22, height: 22, color: "#FFFFFF" }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>Panel de Administración</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>Gestionar pedidos, carta e inventario</div>
                  </div>
                </div>
                <span style={{ fontSize: 18 }}>→</span>
              </Link>
            </div>
          )}

          {profileSavedFeedback && (
            <div
              style={{
                background: "#ECFDF5",
                border: "1.5px solid #10B981",
                color: "#065F46",
                borderRadius: "14px",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
                animation: "b1-slide-up 0.2s ease-out",
              }}
            >
              <i className="fas fa-check-circle" style={{ color: "#059669", fontSize: "18px" }}></i>
              <span>¡Tus datos de entrega fueron guardados con éxito!</span>
            </div>
          )}

          {/* Delivery Profile */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <MapPin style={{ width: 18, height: 18, color: "var(--b1-color-primary)" }} />
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--b1-color-text-main)" }}>
                Datos de Entrega Habitual
              </h4>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--b1-color-text-muted)", margin: "0 0 14px", lineHeight: 1.45 }}>
              Estos datos se <strong>autocompletarán automáticamente</strong> en tus pedidos para que no tengas que escribirlos cada vez.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label className="b1-form-label" style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, display: "block" }}>
                Nombre completo
              </label>
              <Input
                type="text"
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

            <div style={{ marginBottom: 14 }}>
              <label className="b1-form-label" style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, display: "block" }}>
                Teléfono / WhatsApp *
              </label>
              <Input
                type="tel"
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

            {/* Address fields */}
            <div style={{ background: "var(--b1-color-surface-subtle)", border: "1.5px solid var(--b1-color-border)", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ marginBottom: 10 }}>
                <label className="b1-form-label" style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--b1-color-text-main)" }}>
                  Dirección de entrega
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <div style={{ flex: 2.3 }}>
                  <Input
                    type="text"
                    placeholder="Calle *"
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
                  <Input
                    type="text"
                    placeholder="Número *"
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

              <div>
                <Input
                  type="text"
                  placeholder="Piso / Depto / Indicaciones (Opcional)"
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

            <Button
              type="button"
              variant="default"
              className="w-full py-3.5 text-base font-extrabold rounded-2xl"
              onClick={handleSaveProfile}
            >
              Guardar Mis Datos
            </Button>
          </div>

          {/* Store Info */}
          <div style={{ borderTop: "1px solid var(--b1-color-border-light)", paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--b1-color-text-muted)", marginBottom: 10 }}>
              Información del Comercio
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a
                href={`https://wa.me/${(storeInfo.whatsapp || "+5491172570867").replace(/[^\d]/g, "")}?text=${encodeURIComponent("¡Hola! Tengo una consulta sobre el menú de " + storeInfo.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="b1-drawer-item"
                style={{ borderRadius: 12, padding: "10px 14px", border: "1px solid var(--b1-color-border-light)", textDecoration: "none" }}
              >
                <div className="b1-drawer-item-left">
                  <div className="b1-drawer-item-icon" style={{ background: "rgba(37, 211, 102, 0.12)", color: "#25D366" }}>
                    <i className="fab fa-whatsapp"></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--b1-color-text-main)" }}>WhatsApp del Local</div>
                    <div style={{ fontSize: 12, color: "var(--b1-color-text-muted)" }}>
                      {storeInfo.whatsapp || "+54 9 11 7257-0867"}
                    </div>
                  </div>
                </div>
                <i className="fas fa-external-link-alt" style={{ color: "var(--b1-color-text-muted)", fontSize: 12 }}></i>
              </a>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeInfo.address || "Paderewski 3666, Buenos Aires")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="b1-drawer-item"
                style={{ borderRadius: 12, padding: "10px 14px", border: "1px solid var(--b1-color-border-light)", textDecoration: "none" }}
              >
                <div className="b1-drawer-item-left">
                  <div className="b1-drawer-item-icon" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6" }}>
                    <MapPin style={{ width: 16, height: 16 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--b1-color-text-main)" }}>Ubicación del Local</div>
                    <div style={{ fontSize: 12, color: "var(--b1-color-text-muted)" }}>
                      {storeInfo.address || "Paderewski 3666"}
                    </div>
                  </div>
                </div>
                <i className="fas fa-external-link-alt" style={{ color: "var(--b1-color-text-muted)", fontSize: 12 }}></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
