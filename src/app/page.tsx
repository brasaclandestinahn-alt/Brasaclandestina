"use client";
import { useState, useEffect } from "react";
import { Product, OrderItem, MOCK_PRODUCTS } from "@/lib/mockDB";
import { useAppState } from "@/lib/useStore";
import ProductCard from "@/components/Menu/ProductCard";
import CartDrawer from "@/components/Cart/CartDrawer";

export default function PwaMenuPage() {
    const { state, addOrder, getProductAvailability } = useAppState();
    const [cartItems, setCartItems] = useState<OrderItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState("Todas");
  
    // UI Local State
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);
  
    // Usar productos de la nube si existen, si no los mocks locales de inmediato
    const displayProducts = (state.products && state.products.length > 0) 
        ? state.products 
        : MOCK_PRODUCTS;

    const categories = ["Todas", ...Array.from(new Set(displayProducts.map(p => p.category)))];
  
    const filteredProducts = activeCategory === "Todas" 
      ? displayProducts 
      : displayProducts.filter(p => p.category === activeCategory);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * product.price } 
          : item
        );
      }
      return [...prev, { 
        product_id: product.id, 
        product_name: product.name, // Nombre capturado para historial de ventas
        quantity: 1, 
        subtotal: product.price 
      }];
    });
  };

  const handleCheckout = (customerData: any) => {
    const orderTotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
    addOrder({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      type: customerData.type,
      table_number: "PWA Digital",
      customer_name: customerData.name,
      customer_phone: customerData.phone,
      customer_address: customerData.address,
      payment_method: customerData.payment,
      scheduled_time: customerData.scheduled_time,
      status: "pending",
      items: cartItems,
      total: orderTotal,
      created_at: new Date().toISOString()
    });
    setCartItems([]);
    setIsCartOpen(false);
    alert("¡Pedido enviado a Cocina exitosamente!");
  };

    // Evitar parpadeo de hidratacion
    if (!hydrated) return <div style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh" }} />;

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "80px", maxWidth: "1200px", margin: "0 auto", backgroundColor: "var(--bg-primary)" }}>
      {/* Header Premium PWA */}
      <header style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, backgroundColor: "var(--bg-primary)", zIndex: 10 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-color)" }}>Brasa Clandestina</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Auténtico sabor de la calle</p>
        </div>
      </header>

      {/* Category Nav */}
      <nav style={{ display: "flex", overflowX: "auto", padding: "1rem 1.5rem", gap: "0.75rem", scrollbarWidth: "none" }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "0.5rem 1rem", borderRadius: "100px", whiteSpace: "nowrap",
              backgroundColor: activeCategory === cat ? "var(--text-primary)" : "var(--bg-secondary)",
              color: activeCategory === cat ? "var(--bg-primary)" : "var(--text-primary)",
              border: `1px solid var(--border-color)`, fontWeight: 600, transition: "0.2s"
            }}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Product Grid */}
      <main style={{ padding: "1.5rem" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
          gap: "1.5rem" 
        }}>
          {filteredProducts.map(product => (
            <ProductCard 
                key={product.id} 
                product={product} 
                availability={getProductAvailability(product)} 
                onAdd={handleAddToCart} 
            />
          ))}
        </div>
      </main>

      {/* Floating Action Button for Cart */}
      {totalItems > 0 && (
        <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 20, width: "calc(100% - 3rem)", maxWidth: "400px" }}>
          <button 
            className="btn-primary" 
            style={{ width: "100%", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}
            onClick={() => setIsCartOpen(true)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ backgroundColor: "white", color: "var(--accent-color)", padding: "0.25rem 0.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 800 }}>
                {totalItems}
              </span>
              <span>Ver Pedido</span>
            </div>
            <span>L {cartItems.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Drawer */}
      <CartDrawer 
        items={cartItems} 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={handleCheckout}
      />
    </div>
  );
}
