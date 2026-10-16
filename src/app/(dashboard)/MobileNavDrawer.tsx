"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Users,
  Cake,
  Receipt,
  BarChart3,
  LogOut,
  Sliders,
  Menu,
  X
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

interface UserSession {
  nome: string;
  role: "DONA" | "AJUDANTE";
}

export default function MobileNavDrawer({
  sessao,
  children,
}: {
  sessao: UserSession | null;
  children: React.ReactNode;
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = usePathname();

  const fecharMenu = () => setMenuAberto(false);

  const links = [
    { href: "/", label: "Visão Geral (Painel)", icon: LayoutDashboard },
    { href: "/vendas", label: "Vendas e Fiados", icon: ShoppingBag },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/produtos", label: "Produtos e Preços", icon: Cake },
    { href: "/despesas", label: "Despesas e Gastos", icon: Receipt },
  ];

  if (sessao?.role === "DONA") {
    links.push({ href: "/relatorios", label: "Relatórios e Grades", icon: BarChart3 });
    links.push({ href: "/fase2/ingredientes", label: "Ingredientes & Fichas", icon: Sliders });
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* Barra de Topo Mobile */}
      <header className="bg-amber-950 text-white px-4 py-3 flex items-center justify-between md:hidden sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="p-1.5 rounded-lg bg-amber-900 text-amber-200 hover:text-white"
            aria-label="Abrir menu"
          >
            {menuAberto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/" className="font-bold text-lg text-amber-100 flex items-center gap-1.5">
            <span>🎂</span> Bolaria
          </Link>
        </div>

        <Link
          href="/vendas/nova"
          className="bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-black px-3 py-2 rounded-lg flex items-center gap-1 shadow"
        >
          <PlusCircle className="w-4 h-4" /> Nova Venda
        </Link>
      </header>

      {/* Drawer Overlay Mobile */}
      {menuAberto && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
          onClick={fecharMenu}
        />
      )}

      {/* Sidebar Fixo Desktop (h-screen sticky top-0) + Drawer Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-amber-950 text-amber-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:w-64 md:translate-x-0 shrink-0 ${
          menuAberto ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-amber-900 flex items-center justify-between">
          <Link href="/" onClick={fecharMenu} className="flex items-center gap-3">
            <span className="text-3xl">🎂</span>
            <div>
              <h1 className="font-bold text-lg text-amber-100 tracking-tight">Bolaria</h1>
              <p className="text-xs text-amber-300">Gestão Confeitaria</p>
            </div>
          </Link>

          <button
            onClick={fecharMenu}
            className="md:hidden p-1 text-amber-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Botão de Destaque: Lançamento Rápido */}
        <div className="p-4">
          <Link
            href="/vendas/nova"
            onClick={fecharMenu}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold py-3 px-4 rounded-xl shadow transition"
          >
            <PlusCircle className="w-5 h-5" />
            Nova Venda
          </Link>
        </div>

        {/* Navegação Principal */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const ativo = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={fecharMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium ${ativo
                    ? "bg-amber-800 text-white font-bold shadow-xs"
                    : "text-amber-200 hover:text-white hover:bg-amber-900/60"
                  }`}
              >
                <Icon className={`w-5 h-5 ${ativo ? "text-amber-300" : "text-amber-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé Usuário */}
        <div className="p-4 border-t border-amber-900 flex items-center justify-between text-xs text-amber-300">
          <div>
            <div className="font-semibold text-white">{sessao?.nome || "Usuária"}</div>
            <div>{sessao?.role === "DONA" ? "Dona (Acesso Total)" : "Ajudante"}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sair do sistema"
              className="p-2 hover:bg-amber-900 text-amber-300 hover:text-white rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Conteúdo Principal com Scroll Independente */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Barra de Navegação Inferior Fixa para Mobile (Thumb-friendly) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 px-3 py-2 flex items-center justify-around z-30 shadow-lg">
        <Link
          href="/"
          className={`flex flex-col items-center text-[10px] font-semibold ${pathname === "/" ? "text-amber-600 font-bold" : "text-stone-500"
            }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          Início
        </Link>
        <Link
          href="/vendas"
          className={`flex flex-col items-center text-[10px] font-semibold ${pathname === "/vendas" ? "text-amber-600 font-bold" : "text-stone-500"
            }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          Vendas
        </Link>
        <Link
          href="/vendas/nova"
          className="flex flex-col items-center -mt-5 bg-amber-500 text-amber-950 p-2.5 rounded-full shadow-lg border-2 border-white"
        >
          <PlusCircle className="w-6 h-6" />
        </Link>
        <Link
          href="/clientes"
          className={`flex flex-col items-center text-[10px] font-semibold ${pathname === "/clientes" ? "text-amber-600 font-bold" : "text-stone-500"
            }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          Clientes
        </Link>
        <Link
          href="/despesas"
          className={`flex flex-col items-center text-[10px] font-semibold ${pathname === "/despesas" ? "text-amber-600 font-bold" : "text-stone-500"
            }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          Gastos
        </Link>
      </nav>
    </div>
  );
}
