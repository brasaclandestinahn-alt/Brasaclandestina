import { NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 50;   // 50 requests
const WINDOW_MS = 60_000;  // por minuto

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_REQUESTS) return false;
  record.count++;
  return true;
}

/**
 * Brasa Clandestina - Store Status API
 * Logic: Open Thursday to Saturday, 6:30 PM - 9:30 PM (UTC-6)
 */
export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espera un momento.' }, 
        { status: 429 }
      );
    }
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

    const response = NextResponse.json({
      open: isOpen,
      eta: isOpen ? '35–45 min' : null,
      nextOpen: isOpen ? null : 'Jueves a las 6:30pm',
      message: isOpen
        ? '🔥 ¡Abierto Ahora! · Entrega 35–45 min'
        : '🌙 Cerrado · Abrimos Jueves a las 6:30pm'
    });
    
    // Cache de 60 segundos en CDN, 30 segundos en navegador
    response.headers.set(
      'Cache-Control', 
      'public, s-maxage=60, max-age=30, stale-while-revalidate=120'
    );
    
    return response;
  } catch (error) {
    return NextResponse.json({ open: false, message: 'Status unavailable' }, { status: 500 });
  }
}
