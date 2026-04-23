import { NextResponse } from 'next/server';

/**
 * Brasa Clandestina - Store Status API
 * Logic: Open Thursday to Saturday, 6:30 PM - 9:30 PM (UTC-6)
 */
export async function GET() {
  try {
    // Get time in Guatemala (UTC-6) - Fixed TypeScript type for Vercel build
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Guatemala',
      hour: 'numeric',
      hour12: false,
    };
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    
    const hourPart = parts.find(p => p.type === 'hour')?.value;
    const hour = hourPart ? parseInt(hourPart) : 0;

    // Get weekday in Guatemala (UTC-6) using a compatible method
    const weekday = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Guatemala" })).getDay();

    const isCorrectDay = weekday >= 4 && weekday <= 6; // 4=Thu, 5=Fri, 6=Sat
    const isCorrectTime = hour >= 18 && hour < 22; // 6:30 PM - 9:30 PM simplified as 18-21h

    const isOpen = isCorrectDay && isCorrectTime;

    return NextResponse.json({
      open: isOpen,
      eta: isOpen ? '35–45 min' : null,
      nextOpen: isOpen ? null : 'Jueves a las 6:30pm',
      message: isOpen
        ? '🔥 ¡Abierto Ahora! · Entrega 35–45 min'
        : '🌙 Cerrado · Abrimos Jueves a las 6:30pm'
    });
  } catch (error) {
    return NextResponse.json({ open: false, message: 'Status unavailable' }, { status: 500 });
  }
}
