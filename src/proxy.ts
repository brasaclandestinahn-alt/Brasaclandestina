import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Dejamos pasar la solicitud para que AuthGuard en el cliente
  // maneje la sesión con Supabase sin rebotar en bucle
  return NextResponse.next({
    request: { headers: request.headers },
  });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/pos/:path*",
    "/kds/:path*",
    "/delivery/:path*",
  ],
};
