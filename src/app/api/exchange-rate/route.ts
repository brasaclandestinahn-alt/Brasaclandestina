import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const rate = data.rates?.HNL;
    if (!rate || typeof rate !== 'number') throw new Error('Invalid rate');
    return NextResponse.json(
      { rate, source: 'live', updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 's-maxage=3600' } }
    );
  } catch {
    return NextResponse.json(
      { rate: 24.80, source: 'fallback', updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 's-maxage=300' } }
    );
  }
}
