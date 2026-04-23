import { NextResponse } from 'next/server';

/**
 * Brasa Clandestina - Delivery Zone Validator API
 * Validates coverage and returns delivery fees based on location.
 */
export async function POST(request: Request) {
  try {
    const { colonia } = await request.json();
    
    if (!colonia) {
      return NextResponse.json({ error: 'Colonia is required' }, { status: 400 });
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
