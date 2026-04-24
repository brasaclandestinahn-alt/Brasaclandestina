"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useAppState } from "@/lib/useStore";
import { MOCK_PRODUCTS } from "@/lib/mockDB";
import ProductCard from "@/components/Menu/ProductCard";
import MenuHeader from "@/components/Menu/MenuHeader";
import CartPanel from "@/components/Cart/CartPanel";
import CartBottomSheet from "@/components/Cart/CartBottomSheet";
import CheckoutModal from "@/components/Cart/CheckoutModal";

export default function DigitalMenuPage() {
  const { state, hydrated, getProductAvailability } = useAppState();
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [checkoutData, setCheckoutData] = useState<{ isOpen: boolean; notes: string }>({ isOpen: false, notes: "" });

  const displayProducts = useMemo(() => {
    return (state.products && state.products.length > 0) ? state.products : MOCK_PRODUCTS;
  }, [state.products]);

  const categories = useMemo(() => {
    return Array.from(new Set(displayProducts.map(p => p.category)));
  }, [displayProducts]);

  // Toast listener
  useEffect(() => {
    const handleToast = (e: any) => {
      setToast({ message: e.detail.message, visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
    };
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  // Checkout modal listener
  useEffect(() => {
    const handleCheckout = (e: any) => {
      setCheckoutData({ isOpen: true, notes: e.detail.notes });
    };
    window.addEventListener('open-online-checkout', handleCheckout);
    return () => window.removeEventListener('open-online-checkout', handleCheckout);
  }, []);

  // Intersection Observer for scroll-spy
  useEffect(() => {
    const observers = categories.map(cat => {
      const el = document.getElementById(`category-${cat}`);
      if (!el) return null;
      
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setActiveCategory(cat);
        }
      }, { threshold: 0.2, rootMargin: "-120px 0px -60% 0px" });
      
      observer.observe(el);
      return observer;
    });

    return () => observers.forEach(o => o?.disconnect());
  }, [categories]);

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const element = document.getElementById(`category-${cat}`);
    if (element) {
      const offset = 130;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  if (!hydrated) return null;

  return (
    <div className="menu-page">
      <MenuHeader 
        categories={categories} 
        activeCategory={activeCategory} 
        onCategoryClick={scrollToCategory} 
      />

      <main className="menu-layout">
        <div className="menu-content">
          {categories.map(category => (
            <section key={category} id={`category-${category}`} className="category-section">
              <h2 className="serif category-title">{category}</h2>
              <div className="product-grid">
                {displayProducts.filter(p => p.category === category).map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    availability={getProductAvailability(product)} 
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Sidebar Cart - Desktop Only */}
        <aside className="cart-sidebar">
          <CartPanel />
        </aside>
      </main>

      {/* Mobile/Tablet View Controls */}
      <div className="mobile-only">
        {state.cart.length > 0 && (
          <button className="floating-cart-bar" onClick={() => setIsCartOpen(true)}>
            <span>Ver pedido · L. {state.cart.reduce((acc, i) => acc + (i.price * i.quantity), 0)}</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Overlays */}
      <CartBottomSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <CheckoutModal 
        isOpen={checkoutData.isOpen} 
        onClose={() => setCheckoutData(prev => ({ ...prev, isOpen: false }))} 
        notes={checkoutData.notes}
      />

      {/* Toast Notification */}
      <div className={`global-toast ${toast.visible ? 'visible' : ''}`}>
        {toast.message}
      </div>

      <style jsx>{`
        .menu-page {
          background-color: #0A0A0A;
          min-height: 100vh;
          padding-top: 140px; /* Space for MenuHeader */
        }
        .menu-layout {
          display: flex;
          gap: 32px;
          align-items: flex-start;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px 60px;
        }
        .menu-content {
          flex: 1;
          min-width: 0;
        }
        .cart-sidebar {
          width: 380px;
          flex-shrink: 0;
          position: sticky;
          top: 140px;
          height: calc(100vh - 160px);
        }
        @media (max-width: 1023px) {
          .cart-sidebar { display: none; }
          .menu-layout { gap: 0; padding: 0 16px 120px; }
        }

        .category-section {
          margin-bottom: 40px;
          scroll-margin-top: 140px;
        }
        .category-title {
          font-size: 24px;
          color: white;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        @media (max-width: 767px) {
          .product-grid { grid-template-columns: 1fr; }
        }

        /* Mobile Controls */
        .mobile-only {
          display: none;
        }
        @media (max-width: 1023px) {
          .mobile-only { display: block; }
        }
        .floating-cart-bar {
          position: fixed;
          bottom: 24px;
          left: 16px;
          right: 16px;
          height: 56px;
          background: #E8593C;
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 800;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 24px;
          box-shadow: 0 8px 32px rgba(232, 89, 60, 0.4);
          z-index: 900;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp { from { transform: translateY(100px); } to { transform: translateY(0); } }

        /* Toast */
        .global-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          background: #1A1A1A;
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid rgba(232, 89, 60, 0.3);
          font-size: 13px;
          font-weight: 700;
          z-index: 5000;
          transform: translateY(-100px);
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .global-toast.visible {
          transform: translateY(0);
        }

        .serif { font-family: 'Playfair Display', serif; }
      `}</style>
    </div>
  );
}
