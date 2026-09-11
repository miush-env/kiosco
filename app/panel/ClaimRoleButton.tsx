"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClaimRoleButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClaim = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "owner" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("¡Permisos de Dueño (Owner) activados correctamente!");
        router.refresh();
        window.location.reload();
      } else {
        alert("Error: " + (data.message || "No se pudo asignar el rol"));
      }
    } catch (e: any) {
      alert("Error al asignar rol: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleClaim}
      className="b1-btn-primary"
      style={{ width: "100%", justifyContent: "center" }}
    >
      <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-crown"}`}></i>
      <span>{loading ? "Asignando permisos..." : "Activar mi rol de Dueño (Owner)"}</span>
    </button>
  );
}
