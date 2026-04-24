"use client";
import { useEffect, useState } from "react";
import CartPanel from "./CartPanel";

interface CartBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartBottomSheet({ isOpen, onClose }: CartBottomSheetProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsAnimating(true);
    } else {
      document.body.style.overflow = "auto";
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  return (
    <div className={`bottom-sheet-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div 
        className={`bottom-sheet-content ${isOpen ? 'active' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="handle-bar" onClick={onClose}>
          <div className="handle"></div>
        </div>
        
        <div className="sheet-body">
          <CartPanel isBottomSheet={true} />
        </div>
      </div>

      <style jsx>{`
        .bottom-sheet-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 2000;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .bottom-sheet-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }
        .bottom-sheet-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 85vh;
          background: #141414;
          border-radius: 24px 24px 0 0;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
        }
        .bottom-sheet-content.active {
          transform: translateY(0);
        }
        .handle-bar {
          width: 100%;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .handle {
          width: 40px;
          height: 4px;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
        }
        .sheet-body {
          flex: 1;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
