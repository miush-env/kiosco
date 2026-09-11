"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScannedProduct {
  name: string;
  category: string;
  barcode: string;
  stock: number;
  unit: string;
  expirationDate: string | null;
}

type Phase = "scan" | "found" | "not-found" | "saving" | "success";

export default function ScanPanel({
  onCloseAction,
  onCommittedAction,
}: {
  onCloseAction: () => void;
  onCommittedAction: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [cameraSupported, setCameraSupported] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [phase, setPhase] = useState<Phase>("scan");
  const [barcode, setBarcode] = useState("");
  const [found, setFound] = useState<ScannedProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Existing-product form
  const [addQty, setAddQty] = useState<string>("1");
  const [newExpDate, setNewExpDate] = useState("");

  // New-product form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("unidades");
  const [newStock, setNewStock] = useState<string>("1");
  const [newExpDateCreate, setNewExpDateCreate] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    fetch("/api/inventory/scan/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.categories || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const Detector = (window as any).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setCameraSupported(false);
      return;
    }

    let detector: any;
    try {
      detector = new Detector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
    } catch {
      setCameraSupported(false);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        const scanLoop = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                handleBarcodeDetected(codes[0].rawValue);
                return;
              }
            } catch {
              // ignore per-frame decode errors
            }
          }
          rafRef.current = requestAnimationFrame(scanLoop);
        };
        rafRef.current = requestAnimationFrame(scanLoop);
      })
      .catch(() => {
        setCameraError("No se pudo acceder a la cámara. Podés ingresar el código manualmente.");
      });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const handleBarcodeDetected = async (code: string) => {
    stopCamera();
    setBarcode(code);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/inventory/scan/lookup?barcode=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || "Error al buscar el código.");
        setPhase("scan");
        return;
      }
      if (data.found) {
        setFound(data.product);
        setAddQty("1");
        setNewExpDate("");
        setPhase("found");
      } else {
        setNewName("");
        setNewCategory("");
        setIsAddingCategory(false);
        setNewUnit("unidades");
        setNewStock("1");
        setNewExpDateCreate("");
        setPhase("not-found");
      }
    } catch {
      setErrorMsg("No se pudo conectar con Google Sheets.");
      setPhase("scan");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    handleBarcodeDetected(manualBarcode.trim());
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhase("saving");
    try {
      const res = await fetch("/api/inventory/scan/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjustStock",
          barcode,
          qty: Math.max(1, parseInt(addQty, 10) || 1),
          expirationDate: newExpDate || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPhase("success");
        onCommittedAction();
      } else {
        setErrorMsg(data.message || "No se pudo actualizar el stock.");
        setPhase("found");
      }
    } catch {
      setErrorMsg("No se pudo conectar con Google Sheets.");
      setPhase("found");
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setPhase("saving");
    try {
      const res = await fetch("/api/inventory/scan/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createProduct",
          barcode,
          name: newName,
          category: newCategory,
          unit: newUnit,
          stock: Math.max(0, parseInt(newStock, 10) || 0),
          expirationDate: newExpDateCreate || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPhase("success");
        onCommittedAction();
      } else {
        setErrorMsg(data.message || "No se pudo crear el producto.");
        setPhase("not-found");
      }
    } catch {
      setErrorMsg("No se pudo conectar con Google Sheets.");
      setPhase("not-found");
    }
  };

  const handleClose = () => {
    stopCamera();
    onCloseAction();
  };

  return (
    <div className="b1-modal-backdrop" onClick={handleClose}>
      <div className="adm-scan-panel open" onClick={(e) => e.stopPropagation()} style={{ position: "static", transform: "none", maxWidth: 480, width: "100%" }}>
        <div className="adm-scan-header">
          <span className="adm-modal-title">Escanear Código</span>
          <button type="button" className="adm-modal-close" onClick={handleClose}>✕</button>
        </div>

        {phase === "scan" && (
          <>
            {cameraSupported && (
              <div className="adm-scan-camera-wrap">
                <video ref={videoRef} muted playsInline></video>
                <div className="adm-scan-viewfinder"></div>
              </div>
            )}

            {(cameraError || !cameraSupported) && (
              <div style={{ padding: "14px 20px 0" }}>
                <div className="adm-scan-msg">
                  {cameraError || "Tu navegador no soporta escaneo por cámara. Ingresá el código manualmente."}
                </div>
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="adm-scan-manual">
              <input
                type="text"
                placeholder="Ingresar código manualmente..."
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
              />
              <button type="submit" className="adm-btn-sm-primary">Buscar</button>
            </form>

            <div className="adm-scan-result-area">
              {errorMsg && <div className="adm-scan-msg" style={{ color: "var(--adm-danger)" }}>{errorMsg}</div>}
            </div>
          </>
        )}

        {phase === "found" && found && (
          <form onSubmit={handleAdjustStock}>
            <div className="adm-scan-result-area">
              <div className="adm-scan-msg success">
                <i className="fas fa-check-circle"></i> Encontrado: {found.name} — Stock actual: {found.stock} {found.unit}
              </div>

              <div className="adm-scan-confirm-card">
                <div className="adm-form-group">
                  <label className="adm-form-label">Cantidad a sumar *</label>
                  <input
                    type="number"
                    min="1"
                    className="adm-input"
                    required
                    value={addQty}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setAddQty(e.target.value)}
                  />
                </div>
                <div className="adm-form-group" style={{ marginBottom: 0 }}>
                  <label className="adm-form-label">Nueva fecha de vencimiento</label>
                  <input
                    type="date"
                    className="adm-input"
                    value={newExpDate}
                    onChange={(e) => setNewExpDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="adm-modal-footer">
              <button type="button" className="adm-btn-cancel" onClick={() => setPhase("scan")}>Cancelar</button>
              <button type="submit" className="adm-btn-submit success">Sumar Stock</button>
            </div>
          </form>
        )}

        {phase === "not-found" && (
          <form onSubmit={handleCreateProduct}>
            <div className="adm-scan-result-area">
              <div className="adm-scan-msg">
                Código <strong>{barcode}</strong> no está en la planilla. Cargalo una vez:
              </div>

              <div className="adm-scan-confirm-card">
                <div className="adm-form-group">
                  <label className="adm-form-label">Nombre *</label>
                  <input
                    type="text"
                    className="adm-input"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="adm-form-group">
                  <label className="adm-form-label">Categoría *</label>
                  {isAddingCategory ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="Ej: Gaseosas"
                        required
                        autoFocus
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      />
                      <button
                        type="button"
                        className="adm-btn-cancel"
                        style={{ padding: "0 12px" }}
                        onClick={() => {
                          setIsAddingCategory(false);
                          setNewCategory("");
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      className="adm-input"
                      required
                      value={newCategory}
                      onChange={(e) => {
                        if (e.target.value === "__new__") {
                          setIsAddingCategory(true);
                          setNewCategory("");
                        } else {
                          setNewCategory(e.target.value);
                        }
                      }}
                    >
                      <option value="" disabled>Elegí una categoría...</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__new__">+ Nueva categoría...</option>
                    </select>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Stock inicial</label>
                    <input
                      type="number"
                      className="adm-input"
                      value={newStock}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setNewStock(e.target.value)}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Unidad</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                    />
                  </div>
                </div>
                <div className="adm-form-group" style={{ marginBottom: 0 }}>
                  <label className="adm-form-label">Vencimiento</label>
                  <input
                    type="date"
                    className="adm-input"
                    value={newExpDateCreate}
                    onChange={(e) => setNewExpDateCreate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="adm-modal-footer">
              <button type="button" className="adm-btn-cancel" onClick={() => setPhase("scan")}>Cancelar</button>
              <button type="submit" className="adm-btn-submit">Crear Producto</button>
            </div>
          </form>
        )}

        {phase === "saving" && (
          <div className="adm-scan-result-area">
            <div className="adm-scan-msg">
              <i className="fas fa-spinner fa-spin"></i> Guardando en Google Sheets...
            </div>
          </div>
        )}

        {phase === "success" && (
          <div className="adm-scan-result-area">
            <div className="adm-scan-msg success">
              <i className="fas fa-check-circle"></i> ¡Listo! Se guardó correctamente.
            </div>
            <div className="adm-modal-footer" style={{ padding: "14px 0 0" }}>
              <button
                type="button"
                className="adm-btn-submit"
                onClick={() => {
                  setPhase("scan");
                  setManualBarcode("");
                  setBarcode("");
                  setFound(null);
                }}
              >
                Escanear Otro
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
