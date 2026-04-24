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
    <div className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto">
      <button
        id="floating-cart-bar"
        onClick={onClick}
        className="w-full bg-[#E8603C] text-white flex justify-between items-center p-3 sm:p-4 rounded-2xl shadow-2xl shadow-orange-500/50 transition-all duration-200 active:scale-95 hover:scale-[1.02] cursor-pointer border-none"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg px-2.5 py-0.5 text-[13px] font-black">
            {count}
          </div>
          <span className="font-extrabold text-sm tracking-wide uppercase">🔥 Ver pedido</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-base">L. {total.toFixed(0)}</span>
          <span className="text-lg">→</span>
        </div>
      </button>
    </div>
  );
}
