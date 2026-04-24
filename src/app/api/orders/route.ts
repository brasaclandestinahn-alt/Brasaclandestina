import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      customerName, 
      phone, 
      address, 
      addressReference, 
      paymentMethod, 
      changeFor, 
      transferConfirmed, 
      notes, 
      items, 
      subtotal, 
      total 
    } = body;

    // 1. Validaciones básicas
    if (!customerName || !phone || !address || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // 2. Generar Order ID: BC- + últimos 6 dígitos de timestamp
    const orderId = `BC-${Date.now().toString().slice(-6)}`;

    // 3. Mapear datos para la base de datos (compatibilidad con interfaz Order)
    const orderData = {
      id: orderId,
      customer_name: customerName,
      customer_phone: phone,
      customer_address: address,
      address_reference: addressReference,
      payment_method: paymentMethod,
      change_for: changeFor,
      transfer_confirmed: transferConfirmed,
      notes: notes,
      items: items.map((i: any) => ({
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        subtotal: i.price * i.quantity
      })),
      total: total,
      type: 'delivery',
      status: 'pending', // ID del estado inicial
      is_online: true,
      created_at: new Date().toISOString()
    };

    // 4. Guardar en Supabase
    const { error } = await supabase.from('orders').insert([orderData]);

    if (error) {
      console.error('Error saving order:', error);
      return NextResponse.json({ success: false, error: 'Error al guardar el pedido' }, { status: 500 });
    }

    // 5. Generar URL de WhatsApp para notificación al dueño (Opción B de respaldo)
    const adminPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '50499999999';
    const itemsText = items.map((i: any) => `- ${i.quantity}x ${i.name}`).join('\n');
    const waMsg = `🔥 NUEVO PEDIDO ONLINE #${orderId}\n` +
                  `👤 ${customerName} · 📞 ${phone}\n` +
                  `📍 ${address}\n` +
                  `${addressReference ? `🏠 Ref: ${addressReference}\n` : ''}` +
                  `-------------------\n` +
                  `${itemsText}\n` +
                  `-------------------\n` +
                  `💰 Total: L. ${total}\n` +
                  `💳 Pago: ${paymentMethod === 'cash' ? `Efectivo (Cambio de L. ${changeFor})` : 'Transferencia'}\n` +
                  `${notes ? `📝 Notas: ${notes}` : ''}`;
    
    const waUrl = `https://wa.me/${adminPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`;

    return NextResponse.json({ 
      success: true, 
      orderId: orderId,
      notificationUrl: waUrl
    });

  } catch (error) {
    console.error('Critical Order API Error:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
