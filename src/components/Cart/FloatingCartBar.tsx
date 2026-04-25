"use client";
import { useAppState } from "@/lib/useStore";
import { useState, useEffect } from "react";

interface FloatingCartBarProps {
  onClick: () => void;
}

export default function FloatingCartBar({ onClick }: FloatingCartBarProps) {
  const { getCartCount, getCartTotal } = useAppState();
  const count = getCartCount();
  const total = getCartTotal();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (count > 0) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [count]);

  if (count === 0) return null;

  return (
    <div 
      className="fixed bottom-6 left-4 right-4 z-[9999] max-w-md mx-auto"
      style={{
        transition: "transform 0.45s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease",
        transform: visible ? "translateY(0)" : "translateY(100px)",
        opacity: visible ? 1 : 0
      }}
    >
      <button
        id="floating-cart-bar"
        onClick={onClick}
        className="w-full bg-[#E8603C] text-white flex justify-between items-center p-3 sm:p-4 rounded-2xl transition-all duration-200 active:scale-95 hover:scale-[1.02] cursor-pointer border-none"
        style={{
          animation: "cartGlow 2s infinite ease-in-out"
        }}
      >
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm tracking-wide uppercase">
            🔥 Ver pedido · {count} {count === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-base">L. {total.toFixed(0)}</span>
          <span className="text-lg">→</span>
        </div>
      </button>

      <style>{`
        @keyframes cartGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(232,96,60,0.4); }
          50% { box-shadow: 0 4px 40px rgba(232,96,60,0.8); }
        }
      `}</style>
    </div>
  );
}
