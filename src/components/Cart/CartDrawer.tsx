"use client";
import { useState } from "react";
import { useAppState } from "@/lib/useStore";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { state, updateQuantity, removeFromCart, getCartTotal, clearCart } = useAppState();
  const [notes, setNotes] = useState("");
  
  const total = getCartTotal();
  const cartItems = state.cart;
  const config = state.config;

  const generateWhatsAppMessage = () => {
    // Restaurant status check
    const now = new Date();
    const offset = -6; // Honduras
    const hondurasTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (offset * 3600000));
    const day = hondurasTime.getDay();
    const hour = hondurasTime.getHours();
    const min = hondurasTime.getMinutes();
    const timeValue = hour + min / 60;
    
    const isOpenTime = (day >= 4 && day <= 6) && (timeValue >= 18.5 && timeValue < 21.5);

    if (!isOpenTime) {
      const confirmSend = window.confirm(
        "El restaurante abre Jue-Sáb 6:30pm. ¿Quieres enviar el pedido de todas formas para que lo tengan listo?"
      );
      if (!confirmSend) return;
    }

    const itemsList = cartItems.map(item => 
      `• ${item.quantity}x ${item.name} — L. ${item.price * item.quantity}`
    ).join('\n');
    
    const message = `Hola Brasa Clandestina 🔥 Quiero hacer un pedido:\n\n${itemsList}\n\n` +
           `${notes ? `📝 Nota: ${notes}\n\n` : ''}` +
           `💰 Total: L. ${total}\n\n` +
           `¿Pueden confirmar disponibilidad y tiempo de entrega?`;
           
    const whatsappUrl = `https://wa.me/${config?.whatsapp_number?.replace(/\D/g, '') || '50499999999'}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-[450px] bg-[#0A0A0A] text-white z-[2001] shadow-2xl flex flex-col animate-slide-in"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="p-6 border-bottom flex justify-between items-center bg-[#111]">
          <div>
            <h2 className="serif text-2xl text-[#E8593C]">Tu Pedido 🔥</h2>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Brasa Clandestina</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
              <span className="text-6xl mb-4">🛒</span>
              <p className="text-lg font-semibold">Tu carrito está vacío</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <h4 className="serif text-lg leading-tight mb-1">{item.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">L. {item.price}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-black rounded-lg border border-white/10 p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:text-[#E8593C] transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:text-[#E8593C] transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-400 p-2"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">L. {item.price * item.quantity}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#111] border-t border-white/10 space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Notas especiales</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Alguna nota especial para tu pedido?"
              className="w-100 p-4 bg-black border border-white/10 rounded-xl text-sm outline-none focus:border-[#E8593C] transition-colors resize-none h-20"
            />
          </div>

          <div className="pt-2 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>L. {total}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery</span>
              <span>A coordinar</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="serif text-xl">TOTAL</span>
              <span className="serif text-3xl text-[#E8593C]">L. {total}</span>
            </div>
          </div>

          <button 
            disabled={cartItems.length === 0}
            onClick={generateWhatsAppMessage}
            className="w-full bg-[#25D366] hover:bg-[#1ebc57] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg shadow-green-500/20"
          >
            <span className="text-xl">💬</span>
            ENVIAR PEDIDO POR WHATSAPP
          </button>
          
          <button 
            onClick={onClose}
            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
          >
            Seguir viendo el menú
          </button>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .animate-slide-in {
            animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .w-100 { width: 100%; }
        `}</style>
      </div>
    </>
  );
}
