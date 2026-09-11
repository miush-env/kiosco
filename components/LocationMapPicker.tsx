"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

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
            cursor: pointer;
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

      // Zoom control in top-right
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

  // Use Current GPS Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17, { animate: true });
          markerRef.current.setLatLng([latitude, longitude]);
        }
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        setIsLocatingUser(false);
        console.warn("Geolocation error:", err);
        alert("No se pudo obtener tu ubicación. Por favor verificá los permisos de ubicación de tu navegador o señalá en el mapa.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                Elegir Ubicación de Entrega
              </h4>
              <p style={{ margin: 0, fontSize: 11, color: "#64748B" }}>
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
              fontSize: 18,
              color: "#64748B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            &times;
          </button>
        </div>

        {/* Search & GPS Bar */}
        <div style={{ padding: "10px 14px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <i
                className="fas fa-search"
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  fontSize: 13,
                }}
              ></i>
              <input
                type="text"
                placeholder="Buscar calle, barrio o punto de referencia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              style={{
                background: "#0F172A",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "0 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isSearching ? "Buscando..." : "Buscar"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocatingUser}
            style={{
              width: "100%",
              background: "#ffffff",
              border: "1.5px solid var(--b1-color-primary, #FF6B00)",
              color: "var(--b1-color-primary, #FF6B00)",
              borderRadius: "10px",
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <i className={`fas ${isLocatingUser ? "fa-spinner fa-spin" : "fa-crosshairs"}`}></i>
            <span>{isLocatingUser ? "Obteniendo tu GPS..." : "Usar mi ubicación actual por GPS"}</span>
          </button>
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
            <span>💡 Tocá en el mapa para mover el pin</span>
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
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 2 }}>
              Dirección seleccionada:
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0F172A",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <i
                className={`fas ${isLoadingAddress ? "fa-spinner fa-spin" : "fa-map-pin"}`}
                style={{ color: "var(--b1-color-primary, #FF6B00)" }}
              ></i>
              <span>{isLoadingAddress ? "Detectando calle y altura..." : displayAddress || "Seleccioná un punto en el mapa"}</span>
            </div>
            {detectedStreet && (
              <div style={{ marginTop: 4, fontSize: 11, color: "#10B981", fontWeight: 700 }}>
                ✓ Calle: {detectedStreet} {detectedNumber ? `• N°: ${detectedNumber}` : ""}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: "#F1F5F9",
                border: "none",
                borderRadius: "12px",
                padding: "12px",
                fontSize: 13,
                fontWeight: 700,
                color: "#475569",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                flex: 2,
                background: "var(--b1-color-primary, #FF6B00)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "12px 18px",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(255, 107, 0, 0.35)",
              }}
            >
              <i className="fas fa-check"></i>
              <span>Confirmar Esta Ubicación</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
