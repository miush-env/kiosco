import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Eye } from "lucide-react";
import { getRole } from "@/lib/roles";
import ClaimRoleButton from "./ClaimRoleButton";
import PanelNavTabs from "./PanelNavTabs";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const role = await getRole();

  // 1. Not Signed In: Clean Mobile Login Card matching app styles
  if (!userId || !user) {
    return (
      <div className="b1-app-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
        <link rel="stylesheet" href="/assets/css/admin-panel.css" />
        <div
          style={{
            background: "var(--b1-color-surface)",
            borderRadius: "var(--b1-radius-xl)",
            padding: "32px 24px",
            width: "100%",
            maxWidth: "380px",
            border: "1px solid var(--b1-color-border-light)",
            boxShadow: "var(--b1-shadow-lg)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--b1-radius-lg)",
              background: "var(--b1-color-primary-light)",
              color: "var(--b1-color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              margin: "0 auto 16px",
            }}
          >
            <i className="fas fa-lock"></i>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--b1-color-text-main)", margin: "0 0 6px" }}>
            Panel de Administración
          </h2>
          <p style={{ fontSize: 13, color: "var(--b1-color-text-muted)", margin: "0 0 20px" }}>
            Iniciá sesión con tu cuenta para acceder a la gestión del negocio.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SignInButton mode="modal">
              <button className="b1-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
              </button>
            </SignInButton>

            <Link
              href="/"
              style={{
                display: "block",
                padding: "12px",
                borderRadius: "var(--b1-radius-pill)",
                border: "1px solid var(--b1-color-border)",
                color: "var(--b1-color-text-muted)",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              ← Volver a la Carta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Signed In but No Role Yet
  if (!role) {
    return (
      <div className="b1-app-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
        <div
          style={{
            background: "var(--b1-color-surface)",
            borderRadius: "var(--b1-radius-xl)",
            padding: "32px 24px",
            width: "100%",
            maxWidth: "380px",
            border: "1px solid var(--b1-color-border-light)",
            boxShadow: "var(--b1-shadow-lg)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--b1-radius-lg)",
              background: "var(--b1-color-primary-light)",
              color: "var(--b1-color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              margin: "0 auto 16px",
            }}
          >
            <i className="fas fa-user-shield"></i>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--b1-color-text-main)", margin: "0 0 6px" }}>
            ¡Hola, {user.firstName || user.username || "Usuario"}!
          </h2>
          <p style={{ fontSize: 13, color: "var(--b1-color-text-muted)", margin: "0 0 16px" }}>
            Tu cuenta está conectada.
          </p>

          <div
            style={{
              background: "var(--b1-color-surface-subtle)",
              borderRadius: "var(--b1-radius-md)",
              padding: "14px",
              textAlign: "left",
              fontSize: 12,
              color: "var(--b1-color-text-main)",
              marginBottom: 16,
              border: "1px solid var(--b1-color-border-light)",
            }}
          >
            <strong style={{ display: "block", marginBottom: 4, color: "var(--b1-color-primary)" }}>
              ¿Sos el dueño del negocio?
            </strong>
            <span>Hacé clic abajo para activar tus permisos de Dueño (Owner).</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ClaimRoleButton />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--b1-color-border-light)" }}>
              <Link href="/" style={{ fontSize: 12, color: "var(--b1-color-text-muted)", fontWeight: 700, textDecoration: "none" }}>
                ← Ir a la Carta
              </Link>
              <UserButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized (Owner or Admin) — 100% Mobile Optimized Topbar matching public app
  return (
    <div className="b1-app-wrapper">
      <link rel="stylesheet" href="/assets/css/admin-panel.css" />
      {/* ── TOPBAR IDENTICAL TO HOME ────────────────────────────────────────── */}
      <header className="b1-topbar">
        <Link href="/" className="b1-topbar-brand">
          <img
            src="/assets/images/logo.png"
            alt="Alakary Logo"
            className="b1-topbar-logo"
          />
          <div className="b1-topbar-info">
            <h1>Alakary</h1>
            <div className="b1-status-pill">
              <span className="b1-status-dot"></span>
              <span>{role === "owner" ? "Panel Dueño" : "Panel Admin"}</span>
            </div>
          </div>
        </Link>

        <div className="b1-topbar-actions">
          {/* Quick link to view public menu */}
          <Link
            href="/"
            className="b1-icon-btn"
            title="Ver carta de clientes"
          >
            <Eye style={{ width: 18, height: 18 }} />
          </Link>

          {/* User Profile */}
          <UserButton />
        </div>
      </header>

      {/* ── SEGMENTED TOP NAVIGATION PILLS (MATCHING HOME PILLS) ───────────── */}
      <div style={{ padding: "12px 18px 0", background: "var(--b1-color-surface)", borderBottom: "1px solid var(--b1-color-border-light)" }}>
        <PanelNavTabs isOwner={role === "owner" || role === "admin"} />
      </div>

      {/* Main Content Area */}
      <main style={{ paddingBottom: "40px" }}>{children}</main>
    </div>
  );
}
