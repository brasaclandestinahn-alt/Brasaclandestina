"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface MenuHeaderProps {
  categories: string[];
  activeCategory: string;
  onCategoryClick: (category: string) => void;
}

export default function MenuHeader({ categories, activeCategory, onCategoryClick }: MenuHeaderProps) {
  const [status, setStatus] = useState({ isOpen: false, text: "" });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const offset = -6;
      const hondurasTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (offset * 3600000));
      const day = hondurasTime.getDay();
      const hour = hondurasTime.getHours();
      const min = hondurasTime.getMinutes();
      const timeValue = hour + min / 60;
      const isOpen = (day >= 4 && day <= 6) && (timeValue >= 18.5 && timeValue < 21.5);
      setStatus({ 
        isOpen, 
        text: isOpen ? "ABIERTO AHORA" : "CERRADO · ABRIMOS JUEVES 6:30PM" 
      });
    };
    checkStatus();
    const timer = setInterval(checkStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  // Center active category pill in mobile scroll
  useEffect(() => {
    if (scrollRef.current && activeCategory) {
      const activeBtn = scrollRef.current.querySelector(`[data-cat="${activeCategory}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeCategory]);

  return (
    <header className="menu-header">
      <div className="header-top">
        <Link href="/" className="logo-link">
          <h1 className="serif">Brasa Clandestina</h1>
        </Link>
        
        <div className={`status-badge ${status.isOpen ? 'open' : 'closed'}`}>
          <span className="status-dot"></span>
          {status.text}
        </div>
      </div>

      <nav className="category-nav" ref={scrollRef}>
        <div className="nav-scroll-container hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              data-cat={cat}
              onClick={() => onCategoryClick(cat)}
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      <style jsx>{`
        .menu-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(12px);
          z-index: 1000;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .serif { font-family: 'Playfair Display', serif; }
        .logo-link { text-decoration: none; }
        .logo-link h1 {
          font-size: 20px;
          color: #E8593C;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .status-badge.open {
          background: rgba(34, 197, 94, 0.1);
          color: #22C55E;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .status-badge.closed {
          background: rgba(232, 89, 60, 0.1);
          color: #E8593C;
          border: 1px solid rgba(232, 89, 60, 0.2);
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 8px currentColor;
        }

        .category-nav {
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          padding: 12px 0;
        }
        .nav-scroll-container {
          display: flex;
          overflow-x: auto;
          gap: 12px;
          padding: 0 24px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .category-pill {
          padding: 8px 20px;
          border-radius: 100px;
          border: none;
          background: rgba(255, 255, 255, 0.06);
          color: #94A3B8;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .category-pill.active {
          background: #E8593C;
          color: white;
          box-shadow: 0 4px 12px rgba(232, 89, 60, 0.3);
        }
        .category-pill:hover:not(.active) {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </header>
  );
}
