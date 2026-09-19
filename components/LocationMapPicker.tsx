"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapPin, Crosshair, Search, X, Check, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface SelectedLocation {
  street: string;
  streetNumber: string;
  lat: number;
  lng: number;
  fullAddress: string;
  googleMapsUrl: string;
}

interface LocationMapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: SelectedLocation) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

export default function LocationMapPicker({
  isOpen,
  onClose,
  onSelect,
  initialLat = -34.6037, // Default: Buenos Aires
  initialLng = -58.3816,
  initialAddress = "",
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [detectedStreet, setDetectedStreet] = useState("");
  const [detectedNumber, setDetectedNumber] = useState("");
  const [displayAddress, setDisplayAddress] = useState(initialAddress);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Reverse geocode lat, lng to address components
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "es",
          },
        }
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.pedestrian || addr.street || addr.neighbourhood || addr.suburb || "";
        const number = addr.house_number || "";
        const city = addr.city || addr.town || addr.municipality || "";

        setDetectedStreet(street);
        setDetectedNumber(number);

        const fullStr = [
          street ? (number ? `${street} ${number}` : street) : "",
          city ? city : "",
        ]
          .filter(Boolean)
          .join(", ");

        setDisplayAddress(fullStr || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } else {
        setDisplayAddress(`Ubicación seleccionada (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      }
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
      setDisplayAddress(`Ubicación seleccionada (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Initialize and mount Leaflet map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Custom high-contrast SVG marker icon
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="
            position: relative;
            transform: translate(-50%, -100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: grab;
            filter: drop-shadow(0 4px 10px rgba(0,0,0,0.35));
          ">
            <div style="
              width: 44px;
              height: 44px;
              background: linear-gradient(135deg, #FF6B00 0%, #E65100 100%);
              border: 3px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="transform: rotate(45deg); font-size: 20px;">📍</span>
            </div>
            <div style="
              width: 12px;
              height: 5px;
              background: rgba(0,0,0,0.25);
              border-radius: 50%;
              margin-top: 2px;
            "></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const map = L.map(mapContainerRef.current, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 16,
        zoomControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      // OpenStreetMap Tile Layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Marker
      const marker = L.marker([currentCoords.lat, currentCoords.lng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      markerRef.current = marker;
      mapInstanceRef.current = map;

      // Update on marker drag end
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setCurrentCoords({ lat: pos.lat, lng: pos.lng });
        reverseGeocode(pos.lat, pos.lng);
      });

      // Update on map click
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCurrentCoords({ lat, lng });
        reverseGeocode(lat, lng);
      });

      // Initial reverse geocode if needed
      reverseGeocode(currentCoords.lat, currentCoords.lng);

      // Force resize calculation after DOM renders
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Robust multi-tier location resolver with Leaflet view centering & fallback
  const handleUseCurrentLocation = async () => {
    setIsLocatingUser(true);

    const updateMapWithCoords = async (lat: number, lng: number, accuracy?: number) => {
      setCurrentCoords({ lat, lng });

      if (mapInstanceRef.current) {
        const L = (await import("leaflet")).default;
        mapInstanceRef.current.setView([lat, lng], 17, { animate: true });

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }

        if (accuracyCircleRef.current) {
          mapInstanceRef.current.removeLayer(accuracyCircleRef.current);
        }
        if (accuracy && accuracy < 5000) {
          accuracyCircleRef.current = L.circle([lat, lng], {
            radius: Math.min(accuracy, 100),
            color: "#FF6B00",
            fillColor: "#FF6B00",
            fillOpacity: 0.12,
            weight: 1.5,
          }).addTo(mapInstanceRef.current);
        }
      }

      await reverseGeocode(lat, lng);
      setIsLocatingUser(false);
    };

    // 1. Try browser geolocation (High Accuracy first)
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      const getPos = (options: PositionOptions): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
      };

      try {
        const pos = await getPos({
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 30000,
        });
        await updateMapWithCoords(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        return;
      } catch (errHigh: any) {
        console.warn("High accuracy geolocation timed out or failed:", errHigh);

        if (errHigh && errHigh.code === 1) {
          setIsLocatingUser(false);
          alert("El navegador tiene bloqueado el permiso de ubicación para este sitio. Hacé clic en el ícono del candado en la barra de navegación para permitir la ubicación.");
          return;
        }

        // Try standard / low accuracy (works on PC Wi-Fi networks without GPS hardware)
        try {
          const posLow = await getPos({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 120000,
          });
          await updateMapWithCoords(posLow.coords.latitude, posLow.coords.longitude, posLow.coords.accuracy);
          return;
        } catch (errLow: any) {
          console.warn("Standard geolocation failed:", errLow);
        }
      }
    }

    // 2. Fallback: Network IP-based location estimation
    try {
      const ipRes = await fetch("https://ipapi.co/json/");
      const ipData = await ipRes.json();
      if (ipData && ipData.latitude && ipData.longitude) {
        await updateMapWithCoords(ipData.latitude, ipData.longitude, 1500);
        return;
      }
    } catch (e) {
      console.warn("IP location fallback failed:", e);
    }

    setIsLocatingUser(false);
    alert("No se pudo detectar tu coordenada GPS exacta. Podés buscar tu calle arriba o hacer un toque directo en el mapa para posicionar el pin.");
  };

  // Search Address or Place
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&addressdetails=1&limit=1`,
        {
          headers: { "Accept-Language": "es" },
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        setCurrentCoords({ lat, lng });
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 17, { animate: true });
          markerRef.current.setLatLng([lat, lng]);
        }

        const addr = item.address || {};
        const street = addr.road || addr.pedestrian || addr.street || addr.neighbourhood || addr.suburb || "";
        const number = addr.house_number || "";
        const city = addr.city || addr.town || "";

        setDetectedStreet(street);
        setDetectedNumber(number);

        const fullStr = [
          street ? (number ? `${street} ${number}` : street) : "",
          city ? city : "",
        ]
          .filter(Boolean)
          .join(", ");

        setDisplayAddress(fullStr || item.display_name);
      } else {
        alert("No se encontraron resultados para esa búsqueda.");
      }
    } catch (err) {
      console.warn("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Confirm Location
  const handleConfirm = () => {
    const googleMapsUrl = `https://maps.google.com/?q=${currentCoords.lat},${currentCoords.lng}`;
    const full = detectedStreet
      ? detectedNumber
        ? `${detectedStreet} ${detectedNumber}`
        : detectedStreet
      : displayAddress;

    onSelect({
      street: detectedStreet || displayAddress,
      streetNumber: detectedNumber,
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      fullAddress: full,
      googleMapsUrl,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          height: "90vh",
          maxHeight: "680px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255, 107, 0, 0.12)",
                color: "var(--b1-color-primary, #FF6B00)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--b1-color-text-main, #1E1B18)" }}>
                Elegir Ubicación de Entrega
              </h4>
              <p style={{ margin: 0, fontSize: 11, color: "var(--b1-color-text-muted, #78716C)" }}>
                Tocá el mapa o arrastrá el pin hasta tu puerta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#F1F5F9",
              border: "none",
              width: 32,
              height: 32,
              borderRadius: "50%",
              color: "#64748B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & GPS Bar */}
        <div style={{ padding: "10px 14px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                className="w-4 h-4 text-slate-400"
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <Input
                type="text"
                placeholder="Buscar calle, barrio o punto de referencia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 py-2 text-xs"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              disabled={isSearching}
              className="px-3.5 py-2 text-xs font-bold"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              <span>{isSearching ? "Buscando..." : "Buscar"}</span>
            </Button>
          </form>

          {/* Leaflet GPS Trigger with multi-tier fallback */}
          <Button
            type="button"
            variant="outline"
            onClick={handleUseCurrentLocation}
            disabled={isLocatingUser}
            className="w-full py-2.5 text-xs font-extrabold border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            {isLocatingUser ? (
              <Loader2 className="w-4 h-4 animate-spin text-orange-600 mr-2" />
            ) : (
              <Crosshair className="w-4 h-4 text-orange-600 mr-2" />
            )}
            <span>{isLocatingUser ? "Localizando tu posición..." : "Usar mi ubicación actual (GPS)"}</span>
          </Button>
        </div>

        {/* Map Container */}
        <div style={{ position: "relative", flex: 1, minHeight: 240, width: "100%" }}>
          <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

          {/* Floating Instruction Chip */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(15, 23, 42, 0.85)",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: 11,
              fontWeight: 700,
              zIndex: 1000,
              pointerEvents: "none",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>💡 Tocá en el mapa o arrastrá el pin para moverlo</span>
          </div>
        </div>

        {/* Footer with detected address and confirm button */}
        <div
          style={{
            padding: "14px 18px",
            background: "#ffffff",
            borderTop: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              padding: "10px 14px",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--b1-color-text-muted, #78716C)", textTransform: "uppercase", marginBottom: 2 }}>
              Dirección seleccionada:
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--b1-color-text-main, #1E1B18)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isLoadingAddress ? (
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
              ) : (
                <MapPin className="w-4 h-4 text-orange-500" />
              )}
              <span>{isLoadingAddress ? "Detectando calle y altura..." : displayAddress || "Seleccioná un punto en el mapa"}</span>
            </div>
            {detectedStreet && (
              <div style={{ marginTop: 4, fontSize: 11, color: "#10B981", fontWeight: 700 }}>
                ✓ Calle: {detectedStreet} {detectedNumber ? `• N°: ${detectedNumber}` : ""}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleConfirm}
              className="flex-2 py-3 text-sm font-extrabold"
            >
              <Check className="w-4 h-4 mr-1.5" />
              <span>Confirmar Esta Ubicación</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
