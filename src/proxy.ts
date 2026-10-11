import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "bolaria-segredo-super-seguro-troque-em-producao-2026-neon-bury"
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("bolaria_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role as string;

    // Se o usuário for AJUDANTE e tentar acessar relatórios completos ou configurações restritas
    if (role === "AJUDANTE" && (pathname.startsWith("/relatorios") || pathname.startsWith("/configuracoes"))) {
      return NextResponse.redirect(new URL("/vendas", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
