"use client";

import React from "react";

interface OrderReceiptModalProps {
  receiptImage: string | null;
  onClose: () => void;
}

export default function OrderReceiptModal({
  receiptImage,
  onClose,
}: OrderReceiptModalProps) {
  if (!receiptImage) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div style={{ width: "100%", maxWidth: 600, textAlign: "right", marginBottom: 8 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.2)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 38,
            height: 38,
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          &times;
        </button>
      </div>
      <img
        src={receiptImage}
        alt="Comprobante de Transferencia"
        style={{
          maxWidth: "100%",
          maxHeight: "85vh",
          objectFit: "contain",
          borderRadius: 10,
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
