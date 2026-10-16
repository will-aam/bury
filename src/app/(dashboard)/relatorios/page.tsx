import { prisma } from "@/lib/prisma";
import { formatarCentavosParaReal, formatarDataPtBr } from "@/lib/formatadores";
import Link from "next/link";
import { BarChart3, Download, Printer, Filter } from "lucide-react";
import GradeMensalTabela from "./GradeMensalTabela";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string; clienteId?: string }>;
}) {
  const params = await searchParams;
  const agora = new Date();
  const ano = parseInt(params.ano || "") || agora.getFullYear();
  const mes = parseInt(params.mes || "") || agora.getMonth() + 1; // 1 a 12
  const clienteId = params.clienteId || undefined;

  const dataInicio = new Date(ano, mes - 1, 1);
  const dataFim = new Date(ano, mes, 0, 23, 59, 59);

  // Buscar todos os clientes e produtos para filtros e cabeçalho da grade
  const [clientes, produtos] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { nome: "asc" } }),
    prisma.produto.findMany({ orderBy: { nome: "asc" } }),
  ]);

  // Vendas do período
  const vendas = await prisma.venda.findMany({
    where: {
      data: { gte: dataInicio, lte: dataFim },
      ...(clienteId ? { clienteId } : {}),
    },
    include: {
      cliente: true,
      itens: { include: { produto: true } },
      pagamentos: true,
    },
    orderBy: { data: "asc" },
  });

  // Despesas do período
  const despesas = await prisma.despesa.findMany({
    where: {
      data: { gte: dataInicio, lte: dataFim },
    },
    include: { categoria: true },
  });

  // Totais consolidados
  const totalFaturamento = vendas.reduce((acc, v) => {
    return acc + v.itens.reduce((iAcc, item) => iAcc + item.quantidade * item.precoUnitario, 0);
  }, 0);

  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const resultadoLiquido = totalFaturamento - totalDespesas;

  // Grade Mensal: Produtos por Dia
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const gradeDias: Record<number, Record<string, number>> = {};
  for (let d = 1; d <= diasNoMes; d++) {
    gradeDias[d] = {};
  }

  for (const v of vendas) {
    const dia = new Date(v.data).getDate();
    for (const item of v.itens) {
      gradeDias[dia][item.produtoId] = (gradeDias[dia][item.produtoId] || 0) + item.quantidade;
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Relatórios Financeiros e Operacionais
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Grade de produção mensal, vendas por cliente/produto e balanço DRE
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/api/exportar/csv?ano=${ano}&mes=${mes}${clienteId ? `&clienteId=${clienteId}` : ""}`}
            className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </Link>
        </div>
      </div>

      {/* Barra de Filtros de Período e Cliente */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Mês</label>
            <select
              name="mes"
              defaultValue={mes}
              className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900 font-semibold"
            >
              {[
                { v: 1, n: "Janeiro" },
                { v: 2, n: "Fevereiro" },
                { v: 3, n: "Março" },
                { v: 4, n: "Abril" },
                { v: 5, n: "Maio" },
                { v: 6, n: "Junho" },
                { v: 7, n: "Julho" },
                { v: 8, n: "Agosto" },
                { v: 9, n: "Setembro" },
                { v: 10, n: "Outubro" },
                { v: 11, n: "Novembro" },
                { v: 12, n: "Dezembro" },
              ].map((m) => (
                <option key={m.v} value={m.v}>
                  {m.n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Ano</label>
            <input
              type="number"
              name="ano"
              defaultValue={ano}
              className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              Filtrar por Cliente
            </label>
            <select
              name="clienteId"
              defaultValue={clienteId || ""}
              className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900"
            >
              <option value="">Todos os Clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-stone-900 hover:bg-black text-white font-bold py-2.5 px-4 rounded-xl text-sm transition"
            >
              Filtrar Dados
            </button>
          </div>
        </form>
      </div>

      {/* Resumo do Balanço do Período */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">Faturamento do Período</span>
          <div className="text-2xl font-black text-stone-900 mt-2">
            {formatarCentavosParaReal(totalFaturamento)}
          </div>
          <div className="text-xs text-stone-500 mt-1">{vendas.length} vendas registradas</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">Despesas do Período</span>
          <div className="text-2xl font-black text-rose-700 mt-2">
            {formatarCentavosParaReal(totalDespesas)}
          </div>
          <div className="text-xs text-stone-500 mt-1">{despesas.length} despesas lançadas</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">Resultado Líquido</span>
          <div
            className={`text-2xl font-black mt-2 ${
              resultadoLiquido >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {formatarCentavosParaReal(resultadoLiquido)}
          </div>
          <div className="text-xs text-stone-500 mt-1">Lucro operacional antes de impostos</div>
        </div>
      </div>

      {/* Grade Mensal de Bolos por Dia */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-stone-900">
            Grade Mensal de Bolos Produzidos por Dia
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Substitui as abas diárias da planilha: acompanhe a quantidade exata de cada sabor produzida em cada dia do mês.
          </p>
        </div>

        <GradeMensalTabela
          diasNoMes={diasNoMes}
          produtos={produtos}
          gradeDias={gradeDias}
        />
      </div>
    </div>
  );
}
