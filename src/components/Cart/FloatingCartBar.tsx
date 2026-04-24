"use client";
import { useAppState } from "@/lib/useStore";

interface FloatingCartBarProps {
  onClick: () => void;
}

export default function FloatingCartBar({ onClick }: FloatingCartBarProps) {
  const { state, getCartCount, getCartTotal } = useAppState();
  const count = getCartCount();
  const total = getCartTotal();

  if (count === 0) return null;

  return (
    <div className="md:hidden fixed bottom-[80px] left-4 right-4 z-[1002] animate-slide-up">
      <button 
        onClick={onClick}
        className="w-full bg-[#E8593C] text-white h-14 rounded-2xl flex items-center justify-between px-6 shadow-2xl shadow-coral-500/30 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 px-2 py-1 rounded-lg text-sm font-black">
            {count}
          </div>
          <span className="font-extrabold text-sm tracking-tight">VER MI PEDIDO</span>
        </div>
        <div className="font-black text-lg serif">
          L. {total}
        </div>
      </button>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
