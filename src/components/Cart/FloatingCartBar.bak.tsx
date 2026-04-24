"use client";
import { useAppState } from "@/lib/useStore";

interface FloatingCartBarProps {
  onClick: () => void;
}

export default function FloatingCartBar({ onClick }: FloatingCartBarProps) {
  const { getCartCount, getCartTotal } = useAppState();
  const count = getCartCount();
  const total = getCartTotal();

  if (count === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: 20, left: 16, right: 16, zIndex: 1002 }}>
      <button
        id="floating-cart-bar"
        onClick={onClick}
        style={{
          width: "100%",
          height: 56,
          background: "#E8603C",
          color: "#fff",
          border: "none",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(232,96,60,0.45)",
          fontFamily: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.22)", borderRadius: 8, padding: "2px 10px", fontSize: 13, fontWeight: 900 }}>
            {count}
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.04em" }}>🔥 Ver pedido</span>
        </div>
        <span style={{ fontWeight: 900, fontSize: 15 }}>L. {total.toFixed(0)} →</span>
      </button>
    </div>
  );
}
