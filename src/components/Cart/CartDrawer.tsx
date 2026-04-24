"use client";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type DrawerScreen = "cart" | "choose" | "form" | "success";

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { state, updateQuantity, removeFromCart, getCartTotal, clearCart } = useAppState();
  const [screen, setScreen] = useState<DrawerScreen>("cart");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    reference: "",
    payment: "cash",
    changeFor: "",
    transferConfirmed: false
  });

  const total = getCartTotal();
  const cartItems = state.cart;
  const config = state.config;

  // Reset screen when drawer opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setScreen("cart"), 300);
    }
  }, [isOpen]);

  const generateWhatsAppMessage = () => {
    const now = new Date();
    const offset = -6; 
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
           
    const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '') || '50499999999'}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleOnlineSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          phone: formData.phone,
          address: formData.address,
          addressReference: formData.reference,
          paymentMethod: formData.payment,
          changeFor: formData.payment === 'cash' ? Number(formData.changeFor) : null,
          transferConfirmed: formData.transferConfirmed,
          notes: notes,
          items: cartItems,
          subtotal: total,
          total: total
        })
      });

      const data = await response.json();
      if (data.success) {
        setOrderId(data.orderId);
        setScreen("success");
        // Opción B: Notificar al dueño automáticamente
        if (data.notificationUrl) {
          window.open(data.notificationUrl, "_blank");
        }
      } else {
        alert(data.error || "Error al procesar pedido");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.length >= 3 && 
                      formData.phone.replace(/\D/g, '').length >= 8 && 
                      formData.address.length >= 10 &&
                      (formData.payment === 'transfer' ? formData.transferConfirmed : true);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] transition-opacity" onClick={onClose} />
      
      <div className="fixed top-0 right-0 h-full w-full max-w-[450px] bg-[#0A0A0A] text-white z-[2001] shadow-2xl flex flex-col overflow-hidden animate-slide-in" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
        
        {/* Animated Container */}
        <div className="flex-1 flex flex-col transition-transform duration-300 ease-in-out h-full" style={{ 
          width: '400%', 
          flexDirection: 'row',
          transform: `translateX(-${
            screen === 'cart' ? '0%' : 
            screen === 'choose' ? '25%' : 
            screen === 'form' ? '50%' : '75%'
          })` 
        }}>
          
          {/* SCREEN 1: CART */}
          <div className="w-1/4 h-full flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111]">
              <div>
                <h2 className="serif text-2xl text-[#E8593C]">Tu Pedido 🔥</h2>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Brasa Clandestina</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <span className="text-6xl mb-4">🛒</span>
                  <p className="text-lg font-semibold">Tu carrito está vacío</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5 items-center">
                    {item.image_url && <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />}
                    <div className="flex-1">
                      <h4 className="serif text-base leading-tight mb-1">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">L. {item.price}</p>
                    </div>
                    <div className="flex items-center bg-black rounded-lg border border-white/10 p-1 scale-90">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:text-[#E8593C]">-</button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:text-[#E8593C]">+</button>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <p className="font-bold text-sm">L. {item.price * item.quantity}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-[#111] border-t border-white/10 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Notas especiales</label>
                <textarea 
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="¿Alguna nota especial para tu pedido?"
                  className="w-full p-4 bg-black border border-white/10 rounded-xl text-sm outline-none focus:border-[#E8593C] transition-colors resize-none h-20"
                />
              </div>

              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  <span>Subtotal</span>
                  <span>L. {total}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="serif text-xl">TOTAL</span>
                  <span className="serif text-3xl text-[#E8593C]">L. {total}</span>
                </div>
              </div>

              <button 
                disabled={cartItems.length === 0}
                onClick={() => setScreen("choose")}
                className="w-full bg-[#E8593C] hover:bg-[#d44d32] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg"
              >
                CONTINUAR PEDIDO
              </button>
            </div>
          </div>

          {/* SCREEN 2: CHOOSE METHOD */}
          <div className="w-1/4 h-full flex flex-col p-6 space-y-8 bg-[#0A0A0A]">
            <div className="text-center space-y-2">
              <h2 className="serif text-3xl text-white">¿Cómo prefieres pedir?</h2>
              <p className="text-sm text-muted-foreground">Elige la opción que más te convenga</p>
            </div>

            <div className="space-y-4">
              {/* WhatsApp Option */}
              <button 
                onClick={generateWhatsAppMessage}
                className="w-full group relative text-left p-6 bg-[#128C7E]/5 border border-[#128C7E]/30 rounded-2xl hover:border-[#E8593C] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl">WhatsApp</h3>
                    <p className="text-sm text-muted-foreground">Rápido y directo. Te confirmamos en minutos.</p>
                  </div>
                  <span className="absolute top-4 right-4 bg-green-500 text-[10px] font-black px-2 py-1 rounded-full text-white animate-pulse">⚡ MÁS RÁPIDO</span>
                </div>
              </button>

              {/* Online Form Option */}
              <button 
                onClick={() => setScreen("form")}
                className="w-full group relative text-left p-6 bg-[#E8593C]/5 border border-[#E8593C]/30 rounded-2xl hover:border-[#E8593C] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E8593C] rounded-full flex items-center justify-center shadow-lg shadow-coral-500/20">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1m2 14H7v-2h7v2m3-4H7v-2h10v2m0-4H7V7h10v2Z"/></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl">Pedido Online</h3>
                    <p className="text-sm text-muted-foreground">Llena tus datos y recibe confirmación al celular.</p>
                  </div>
                  <span className="absolute top-4 right-4 bg-orange-500/20 text-[#E8593C] text-[10px] font-black px-2 py-1 rounded-full">📋 CON REGISTRO</span>
                </div>
              </button>
            </div>

            <button onClick={() => setScreen("cart")} className="w-full py-4 text-sm font-bold text-muted-foreground hover:text-white transition-colors">
              ← VOLVER AL CARRITO
            </button>
          </div>

          {/* SCREEN 3: ONLINE FORM */}
          <div className="w-1/4 h-full flex flex-col">
            <div className="p-6 border-b border-white/5 bg-[#111] flex items-center gap-4">
              <button onClick={() => setScreen("choose")} className="text-2xl text-muted-foreground hover:text-white">&larr;</button>
              <div>
                <h2 className="serif text-xl">Tus Datos</h2>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Finalizar Pedido Online</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#E8593C]">Nombre completo *</label>
                  <input 
                    type="text" placeholder="Tu nombre"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 h-14 outline-none focus:border-[#E8593C] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#E8593C]">WhatsApp / Teléfono *</label>
                  <div className="relative">
                    <input 
                      type="tel" placeholder="+504 XXXX-XXXX"
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 h-14 outline-none focus:border-[#E8593C] transition-all"
                    />
                    {formData.phone.replace(/\D/g, '').length >= 8 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#E8593C]">Dirección de entrega *</label>
                  <textarea 
                    placeholder="Colonia, calle, número de casa..."
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-24 outline-none focus:border-[#E8593C] transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Referencia de ubicación</label>
                  <input 
                    type="text" placeholder="Casa verde, frente al parque, etc."
                    value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 h-14 outline-none focus:border-[#E8593C] transition-all"
                  />
                </div>

                <div className="pt-4 space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#E8593C]">Método de Pago</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setFormData({...formData, payment: 'cash'})}
                      className={`h-14 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.payment === 'cash' ? 'border-[#E8593C] bg-[#E8593C]/10 text-white' : 'border-white/10 bg-white/5 text-muted-foreground'}`}
                    >
                      <span>💵</span> Efectivo
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, payment: 'transfer'})}
                      className={`h-14 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.payment === 'transfer' ? 'border-[#E8593C] bg-[#E8593C]/10 text-white' : 'border-white/10 bg-white/5 text-muted-foreground'}`}
                    >
                      <span>📱</span> Transfer
                    </button>
                  </div>

                  {formData.payment === 'cash' && (
                    <div className="p-4 bg-white/5 rounded-xl space-y-3 border border-white/10 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">¿Con cuánto vas a pagar?</label>
                      <input 
                        type="number" placeholder="Ej: L. 500"
                        value={formData.changeFor} onChange={e => setFormData({...formData, changeFor: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 h-12 outline-none"
                      />
                      <p className="text-[10px] text-muted-foreground">Calcularemos el cambio para el repartidor.</p>
                    </div>
                  )}

                  {formData.payment === 'transfer' && (
                    <div className="p-4 bg-white/5 rounded-xl space-y-4 border border-white/10 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-[#E8593C]">Datos Bancarios</p>
                        <p className="text-sm font-bold">{process.env.NEXT_PUBLIC_BANK_NAME}</p>
                        <p className="text-xs text-muted-foreground">Cuenta: {process.env.NEXT_PUBLIC_BANK_ACCOUNT}</p>
                        <p className="text-xs text-muted-foreground">Titular: {process.env.NEXT_PUBLIC_BANK_HOLDER}</p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <input 
                          type="checkbox" checked={formData.transferConfirmed}
                          onChange={e => setFormData({...formData, transferConfirmed: e.target.checked})}
                          className="w-5 h-5 accent-[#E8593C]"
                        />
                        <span className="text-xs font-bold">Ya realicé la transferencia</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#111] border-t border-white/10">
              <button 
                disabled={!isFormValid || loading}
                onClick={handleOnlineSubmit}
                className="w-full h-14 bg-[#E8593C] text-white font-black rounded-xl flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "CONFIRMAR PEDIDO 🔥"
                )}
              </button>
            </div>
          </div>

          {/* SCREEN 4: SUCCESS */}
          <div className="w-1/4 h-full flex flex-col items-center justify-center p-8 text-center bg-[#0A0A0A]">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-green-500/50">
              <svg viewBox="0 0 24 24" className="w-12 h-12 fill-green-500 animate-draw-check"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
            
            <h2 className="serif text-3xl mb-2">¡Pedido recibido! 🔥</h2>
            <p className="text-[#E8593C] font-black text-xl mb-4">Orden #{orderId}</p>
            
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Te confirmaremos por WhatsApp al número <span className="text-white font-bold">{formData.phone}</span> en los próximos minutos.
            </p>

            <div className="w-full bg-white/5 rounded-2xl p-6 border border-white/10 mb-8 text-left space-y-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Resumen</p>
              <div className="space-y-1">
                {cartItems.map(i => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{i.quantity}x {i.name}</span>
                    <span className="font-bold">L. {i.price * i.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="font-black">TOTAL</span>
                <span className="text-xl font-black text-[#E8593C]">L. {total}</span>
              </div>
              <p className="text-xs text-center text-green-500 font-bold mt-4 italic">⏱ Entrega estimada: 30-45 min</p>
            </div>

            <div className="w-full space-y-3">
              <button 
                onClick={() => {
                  const msg = `🔥 Mi pedido #${orderId} en Brasa Clandestina:\n${cartItems.map(i => `- ${i.quantity}x ${i.name}`).join('\n')}\nTotal: L.${total}\nDirección: ${formData.address}`;
                  window.open(`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, "_blank");
                }}
                className="w-full h-14 bg-[#25D366] text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                Compartir por WhatsApp
              </button>
              <button 
                onClick={() => {
                  clearCart();
                  onClose();
                }}
                className="w-full h-14 border border-[#E8593C] text-[#E8593C] font-bold rounded-xl"
              >
                Listo, gracias
              </button>
            </div>
          </div>

        </div>

        <style jsx>{`
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
          .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          @keyframes draw-check {
            from { opacity: 0; transform: scale(0.5); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-draw-check { animation: draw-check 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        `}</style>
      </div>
    </>
  );
}
