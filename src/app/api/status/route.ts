import { NextResponse } from 'next/server';

/**
 * Brasa Clandestina - Store Status API
 * Logic: Open Thursday to Saturday, 6:30 PM - 9:30 PM (UTC-6)
 */
export async function GET() {
  try {
    // Get time in Honduras/Guatemala (UTC-6)
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Tegucigalpa',
        hour: 'numeric',
        hour12: false,
        weekday: 'numeric'
    };
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    
    const hourPart = parts.find(p => p.type === 'hour')?.value;
    const weekdayPart = parts.find(p => p.type === 'weekday')?.value;

    const hour = hourPart ? parseInt(hourPart) : 0;
    const weekday = weekdayPart ? parseInt(weekdayPart) : 0; // 0=Sun, 1=Mon, ..., 4=Thu, 5=Fri, 6=Sat

    const isCorrectDay = weekday >= 4 && weekday <= 6;
    const isCorrectTime = hour >= 18 && hour < 22; // 6:30 PM - 9:30 PM simplified as 18-21h for now

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
