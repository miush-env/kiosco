"use client";

import React, { useState } from "react";
import { MapPin, Plus, Check, X, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export interface SavedAddress {
  id: string;
  label: string;
  street: string;
  streetNumber: string;
  details?: string;
}

interface AddressModalProps {
  isOpen: boolean;
  savedAddresses: SavedAddress[];
  currentStreet: string;
  currentStreetNumber: string;
  onClose: () => void;
  onSelectAddress: (addr: SavedAddress) => void;
  onDeleteAddress: (id: string) => void;
  onOpenMapPicker: () => void;
  onSaveManualAddress: (addr: SavedAddress) => void;
}

export default function AddressModal({
  isOpen,
  savedAddresses,
  currentStreet,
  currentStreetNumber,
  onClose,
  onSelectAddress,
  onDeleteAddress,
  onOpenMapPicker,
  onSaveManualAddress,
}: AddressModalProps) {
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newLabel, setNewLabel] = useState("Casa");
  const [newStreet, setNewStreet] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newDetails, setNewDetails] = useState("");

  if (!isOpen) return null;

  const handleManualSubmit = () => {
    if (!newStreet.trim()) {
      alert("Por favor ingresá el nombre de la calle.");
      return;
    }
    const newAddr: SavedAddress = {
      id: "addr_" + Date.now(),
      label: newLabel || "Ubicación",
      street: newStreet.trim(),
      streetNumber: newNumber.trim(),
      details: newDetails.trim(),
    };
    onSaveManualAddress(newAddr);
    setNewStreet("");
    setNewNumber("");
    setNewDetails("");
    setIsAddingNewAddress(false);
  };

  return (
    <div
      className="b1-modal-backdrop"
      onClick={() => {
        onClose();
        setIsAddingNewAddress(false);
      }}
    >
      <div
        className="b1-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "88vh" }}
      >
        <div className="b1-sheet-handle"></div>

        {/* Cabecera */}
        <div className="b1-sheet-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "rgba(234, 88, 12, 0.12)",
                color: "#EA580C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 className="b1-sheet-title" style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                Dirección de Entrega
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--b1-color-text-muted)" }}>
                Elegí dónde recibir tu pedido
              </p>
            </div>
          </div>
          <button
            type="button"
            className="b1-sheet-close"
            onClick={() => {
              onClose();
              setIsAddingNewAddress(false);
            }}
            aria-label="Cerrar"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Cuerpo */}
        <div
          className="b1-sheet-body"
          style={{ padding: "16px 20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}
        >
          {/* Botón Principal: Selector en Mapa Leaflet con Pin */}
          <button
            type="button"
            onClick={onOpenMapPicker}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontSize: 14.5,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(234, 88, 12, 0.35)",
              transition: "all 0.2s ease",
            }}
          >
            <MapPin style={{ width: 20, height: 20 }} />
            <span>Elegir en el Mapa con Pin (Leaflet GPS)</span>
          </button>

          {/* Lista de Ubicaciones Guardadas */}
          <div>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--b1-color-text-muted)",
                marginBottom: 8,
              }}
            >
              Tus Ubicaciones Guardadas ({savedAddresses.length})
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedAddresses.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    background: "var(--b1-color-surface-subtle)",
                    borderRadius: 14,
                    color: "var(--b1-color-text-muted)",
                    fontSize: 13,
                  }}
                >
                  No tenés direcciones guardadas. Elegí una en el mapa o cargala por escrito abajo.
                </div>
              ) : (
                savedAddresses.map((addr) => {
                  const isSelected =
                    (currentStreet || "").trim().toLowerCase() === addr.street.trim().toLowerCase() &&
                    (currentStreetNumber || "").trim() === (addr.streetNumber || "").trim();

                  return (
                    <div
                      key={addr.id}
                      onClick={() => onSelectAddress(addr)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: isSelected
                          ? "2px solid #EA580C"
                          : "1px solid var(--b1-color-border-light)",
                        background: isSelected
                          ? "rgba(234, 88, 12, 0.05)"
                          : "var(--b1-color-surface)",
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: isSelected ? "#EA580C" : "rgba(100, 116, 139, 0.12)",
                            color: isSelected ? "#FFFFFF" : "var(--b1-color-text-muted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MapPin style={{ width: 16, height: 16 }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--b1-color-text-main)" }}>
                              {addr.label || "Ubicación"}
                            </span>
                            {isSelected && (
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                  background: "#EA580C",
                                  color: "#FFFFFF",
                                  padding: "2px 6px",
                                  borderRadius: 6,
                                }}
                              >
                                ACTUAL
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 12.5,
                              color: "var(--b1-color-text-body)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {addr.street} {addr.streetNumber}
                            {addr.details ? ` (${addr.details})` : ""}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
                        {isSelected && (
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: "#EA580C",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check style={{ width: 13, height: 13, strokeWidth: 3 }} />
                          </div>
                        )}

                        {/* Botón Eliminar Dirección */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`¿Eliminar la dirección "${addr.street} ${addr.streetNumber}"?`)) {
                              onDeleteAddress(addr.id);
                            }
                          }}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            border: "none",
                            background: "rgba(239, 68, 68, 0.08)",
                            color: "#EF4444",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s ease",
                          }}
                          title="Eliminar dirección"
                          aria-label={`Eliminar dirección ${addr.street} ${addr.streetNumber}`}
                        >
                          <Trash2 style={{ width: 15, height: 15 }} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Entrada Manual de Dirección */}
          {!isAddingNewAddress ? (
            <button
              type="button"
              onClick={() => setIsAddingNewAddress(true)}
              style={{
                padding: "10px",
                background: "transparent",
                border: "1.5px dashed var(--b1-color-border)",
                borderRadius: 14,
                color: "var(--b1-color-primary)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              <span>Cargar dirección por escrito</span>
            </button>
          ) : (
            <div
              style={{
                background: "var(--b1-color-surface-subtle)",
                border: "1px solid var(--b1-color-border-light)",
                borderRadius: 16,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--b1-color-text-main)" }}>
                Nueva Dirección Escrita
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                {["Casa", "Trabajo", "Pareja", "Otro"].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setNewLabel(lbl)}
                    style={{
                      flex: 1,
                      padding: "6px",
                      borderRadius: 8,
                      fontSize: 11.5,
                      fontWeight: 700,
                      border: newLabel === lbl ? "1.5px solid #EA580C" : "1px solid var(--b1-color-border)",
                      background: newLabel === lbl ? "rgba(234, 88, 12, 0.12)" : "var(--b1-color-surface)",
                      color: newLabel === lbl ? "#EA580C" : "var(--b1-color-text-body)",
                      cursor: "pointer",
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                <Input
                  type="text"
                  placeholder="Calle (ej. Paderewski)"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  className="text-xs py-2"
                />
                <Input
                  type="text"
                  placeholder="Altura / N°"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="text-xs py-2"
                />
              </div>

              <Input
                type="text"
                placeholder="Piso / Depto / Indicaciones (Opcional)"
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                className="text-xs py-2"
              />

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddingNewAddress(false)}
                  className="flex-1 py-2 text-xs font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleManualSubmit}
                  className="flex-2 py-2 text-xs font-extrabold"
                >
                  Guardar y Usar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
