"use client";
import { useAppState } from "@/lib/useStore";
import { useState, useEffect } from "react";

interface CartButtonProps {
  onClick: () => void;
}

export default function CartButton({ onClick }: CartButtonProps) {
  const { getCartCount } = useAppState();
  const count = getCartCount();
  const [isBouncing, setIsBouncing] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <button 
      onClick={onClick}
      className={`relative p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-90 ${isBouncing ? 'animate-bounce-short' : ''}`}
    >
      <span className="text-2xl">🛒</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#ef4444] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0A0A0A] animate-in zoom-in">
          {count}
        </span>
      )}
      
      <style jsx>{`
        @keyframes bounceShort {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-short {
          animation: bounceShort 0.5s ease;
        }
      `}</style>
    </button>
  );
}
