import Link from "next/link";
import { obterSessao } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  PlusCircle, 
  Users, 
  Cake, 
  Receipt, 
  BarChart3, 
  LogOut,
  Sliders
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await obterSessao();

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* Sidebar para Desktop */}
      <aside className="w-full md:w-64 bg-amber-950 text-amber-50 flex flex-col shrink-0 shadow-lg">
        <div className="p-5 border-b border-amber-900 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">🎂</span>
            <div>
              <h1 className="font-bold text-lg text-amber-100 tracking-tight">Bolaria</h1>
              <p className="text-xs text-amber-300">Gestão Confeitaria</p>
            </div>
          </Link>
        </div>

        {/* Botão de Destaque: Lançamento Rápido */}
        <div className="p-4">
          <Link
            href="/vendas/nova"
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold py-3 px-4 rounded-xl shadow transition"
          >
            <PlusCircle className="w-5 h-5" />
            Nova Venda (F2)
          </Link>
        </div>

        {/* Navegação Principal */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-200 hover:text-white hover:bg-amber-900/60 transition text-sm font-medium"
          >
            <LayoutDashboard className="w-5 h-5 text-amber-400" />
            Visão Geral (Painel)
          </Link>

          <Link
            href="/vendas"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-200 hover:text-white hover:bg-amber-900/60 transition text-sm font-medium"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            Vendas e Fiados
          </Link>

          <Link
            href="/clientes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-200 hover:text-white hover:bg-amber-900/60 transition text-sm font-medium"
          >
            <Users className="w-5 h-5 text-amber-400" />
            Clientes
          </Link>

          <Link
            href="/produtos"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-200 hover:text-white hover:bg-amber-900/60 transition text-sm font-medium"
          >
            <Cake className="w-5 h-5 text-amber-400" />
            Produtos e Preços
          </Link>

          <Link
            href="/despesas"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-200 hover:text-white hover:bg-amber-900/60 transition text-sm font-medium"
          >
            <Receipt className="w-5 h-5 text-amber-400" />
            Despesas e Gastos
          </Link>

          {sessao?.role === "DONA" && (
            <>
              <Link
                href="/relatorios"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-200 hover:text-white hover:bg-amber-900/60 transition text-sm font-medium"
              >
                <BarChart3 className="w-5 h-5 text-amber-400" />
                Relatórios e Grades
              </Link>

              <div className="pt-3 pb-1 px-3 text-xs uppercase tracking-wider text-amber-400/80 font-bold">
                Fase 2: Fichas & Custos
              </div>

              <Link
                href="/fase2/ingredientes"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-amber-200 hover:text-white hover:bg-amber-900/60 transition text-sm"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                Ingredientes & Fichas
              </Link>
            </>
          )}
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

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between md:hidden">
          <div className="font-bold text-amber-950 flex items-center gap-2">
            <span>🎂</span> Bolaria
          </div>
          <Link
            href="/vendas/nova"
            className="bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg"
          >
            + Nova Venda
          </Link>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
