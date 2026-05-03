import { NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 30;   // 30 requests
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
 * Brasa Clandestina - Delivery Zone Validator API
 * Validates coverage and returns delivery fees based on location.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espera un momento.' }, 
        { status: 429 }
      );
    }

    // Validar tamaño del payload
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    // Validar que colonia sea string corto
    const body = await request.json();
    const colonia = typeof body.colonia === 'string' 
      ? body.colonia.slice(0, 100) 
      : null;
    if (!colonia) {
      return NextResponse.json({ error: 'Colonia inválida' }, { status: 400 });
    }
    
    const normalized = colonia.toLowerCase().trim();
    
    // Coverage Logic (Simulation based on SPS zones)
    const coverage = [
      'los andes', 'guamilito', 'colonia trejo', 'jardines del valle', 
      'fighueroa', 'monica', 'rio de piedras', 'altamira'
    ];

    const isCovered = coverage.some(zone => normalized.includes(zone));

    if (isCovered) {
      return NextResponse.json({
        covered: true,
        eta: '35–45 min',
        fee: 40, // L. 40 delivery fee
        message: '📍 ¡Zona con cobertura! Llegamos en aprox. 40 min.'
      });
    }

    return NextResponse.json({
      covered: false,
      message: '❌ Lo sentimos, aún no llegamos a esa zona. Prueba por Rappi o PedidosYa.'
    });

  } catch (error) {
    return NextResponse.json({ covered: false, message: 'Service unavailable' }, { status: 500 });
  }
}
