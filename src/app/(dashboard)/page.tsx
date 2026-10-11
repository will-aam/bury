import { prisma } from "@/lib/prisma";
import { formatarCentavosParaReal, formatarDataPtBr } from "@/lib/formatadores";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle, 
  ArrowRight,
  ShoppingBag,
  Cake,
  Users
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);

  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59);

  // Vendas do mês atual
  const vendasMes = await prisma.venda.findMany({
    where: {
      data: { gte: inicioMes, lte: fimMes },
    },
    include: {
      itens: true,
      pagamentos: true,
    },
  });

  // Vendas do mês anterior para comparação
  const vendasMesAnterior = await prisma.venda.findMany({
    where: {
      data: { gte: inicioMesAnterior, lte: fimMesAnterior },
    },
    include: {
      itens: true,
    },
  });

  // Despesas do mês atual
  const despesasMes = await prisma.despesa.findMany({
    where: {
      data: { gte: inicioMes, lte: fimMes },
    },
    include: {
      categoria: true,
    },
  });

  // Todas as vendas com pendência financeira (fiados acumulados)
  const todasVendas = await prisma.venda.findMany({
    include: {
      cliente: true,
      itens: true,
      pagamentos: true,
    },
  });

  // Cálculos consolidados
  const totalVendasMes = vendasMes.reduce((acc, v) => {
    return acc + v.itens.reduce((iAcc, item) => iAcc + item.quantidade * item.precoUnitario, 0);
  }, 0);

  const totalVendasMesAnterior = vendasMesAnterior.reduce((acc, v) => {
    return acc + v.itens.reduce((iAcc, item) => iAcc + item.quantidade * item.precoUnitario, 0);
  }, 0);

  const totalDespesasMes = despesasMes.reduce((acc, d) => acc + d.valor, 0);
  const resultadoMes = totalVendasMes - totalDespesasMes;

  // Cálculo de Fiado / Saldo Devedor por Cliente
  const saldosPorCliente: Record<string, { clienteId: string; nome: string; telefone: string | null; saldoDevedor: number }> = {};

  let totalFiadoGeral = 0;

  for (const venda of todasVendas) {
    const totalVenda = venda.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
    const totalPago = venda.pagamentos.reduce((acc, p) => acc + p.valor, 0);
    const saldoVenda = Math.max(0, totalVenda - totalPago);

    if (saldoVenda > 0) {
      totalFiadoGeral += saldoVenda;
      if (!saldosPorCliente[venda.clienteId]) {
        saldosPorCliente[venda.clienteId] = {
          clienteId: venda.clienteId,
          nome: venda.cliente.nome,
          telefone: venda.cliente.telefone,
          saldoDevedor: 0,
        };
      }
      saldosPorCliente[venda.clienteId].saldoDevedor += saldoVenda;
    }
  }

  const clientesDevedores = Object.values(saldosPorCliente).sort((a, b) => b.saldoDevedor - a.saldoDevedor);

  // Top Produtos do Mês
  const produtosVendidos: Record<string, { nome: string; quantidade: number; total: number }> = {};
  for (const v of vendasMes) {
    for (const item of v.itens) {
      if (!produtosVendidos[item.produtoId]) {
        produtosVendidos[item.produtoId] = { nome: "", quantidade: 0, total: 0 };
      }
      produtosVendidos[item.produtoId].quantidade += item.quantidade;
      produtosVendidos[item.produtoId].total += item.quantidade * item.precoUnitario;
    }
  }

  const produtosDb = await prisma.produto.findMany({
    where: { id: { in: Object.keys(produtosVendidos) } },
  });
  produtosDb.forEach((p) => {
    if (produtosVendidos[p.id]) produtosVendidos[p.id].nome = p.nome;
  });

  const topProdutos = Object.values(produtosVendidos)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  const comparativoPercentual = totalVendasMesAnterior > 0 
    ? Math.round(((totalVendasMes - totalVendasMesAnterior) / totalVendasMesAnterior) * 100)
    : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Painel da Bolaria
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Resumo financeiro e operacional deste mês
          </p>
        </div>

        <Link
          href="/vendas/nova"
          className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition text-sm w-full sm:w-auto"
        >
          <ShoppingBag className="w-5 h-5" />
          Lançar Nova Venda
        </Link>
      </div>

      {/* Cards de Métricas Principais (2 colunas no celular, 4 no desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Vendas */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-stone-500">Vendas</span>
            <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl lg:text-3xl font-black text-stone-900 mt-2 sm:mt-3">
            {formatarCentavosParaReal(totalVendasMes)}
          </div>
          <div className="text-[11px] sm:text-xs text-stone-600 mt-1 sm:mt-2 flex items-center gap-1">
            {comparativoPercentual >= 0 ? (
              <span className="text-emerald-600 font-bold">+{comparativoPercentual}%</span>
            ) : (
              <span className="text-red-600 font-bold">{comparativoPercentual}%</span>
            )}
            <span className="hidden sm:inline">vs anterior</span>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-stone-500">Despesas</span>
            <div className="p-1.5 sm:p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl lg:text-3xl font-black text-stone-900 mt-2 sm:mt-3">
            {formatarCentavosParaReal(totalDespesasMes)}
          </div>
          <div className="text-[11px] sm:text-xs text-stone-600 mt-1 sm:mt-2">
            {despesasMes.length} lançamentos
          </div>
        </div>

        {/* Resultado Líquido */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-stone-500">Resultado</span>
            <div className="p-1.5 sm:p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className={`text-lg sm:text-2xl lg:text-3xl font-black mt-2 sm:mt-3 ${resultadoMes >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {formatarCentavosParaReal(resultadoMes)}
          </div>
          <div className="text-[11px] sm:text-xs text-stone-600 mt-1 sm:mt-2">
            Líquido do mês
          </div>
        </div>

        {/* Total a Receber (Fiados) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-rose-200 shadow-xs bg-gradient-to-br from-white to-rose-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-rose-800">Fiado Total</span>
            <div className="p-1.5 sm:p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl lg:text-3xl font-black text-rose-900 mt-2 sm:mt-3">
            {formatarCentavosParaReal(totalFiadoGeral)}
          </div>
          <div className="text-[11px] sm:text-xs text-rose-700 font-medium mt-1 sm:mt-2">
            {clientesDevedores.length} devedor(es)
          </div>
        </div>
      </div>

      {/* Grid: Clientes com Saldo Devedor & Top Produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Clientes com Saldo em Aberto */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <h2 className="font-bold text-base sm:text-lg text-stone-900">Fiados por Cliente</h2>
            </div>
            <Link
              href="/vendas?status=PENDENTE"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {clientesDevedores.length === 0 ? (
            <div className="text-center py-6 text-stone-600 text-sm">
              🎉 Nenhum cliente com fiado em aberto no momento!
            </div>
          ) : (
            <div className="space-y-3">
              {clientesDevedores.slice(0, 5).map((c) => (
                <div key={c.clienteId} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <div>
                    <span className="font-bold text-stone-900 text-sm block">{c.nome}</span>
                    {c.telefone && <span className="text-xs text-stone-500">{c.telefone}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-rose-700 text-sm">
                      {formatarCentavosParaReal(c.saldoDevedor)}
                    </span>
                    <Link
                      href={`/clientes/${c.clienteId}`}
                      className="text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded-lg"
                    >
                      Cobrar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 Produtos Mais Vendidos */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cake className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-base sm:text-lg text-stone-900">Bolos Mais Vendidos</h2>
            </div>
            <Link
              href="/produtos"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              Produtos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {topProdutos.length === 0 ? (
            <div className="text-center py-6 text-stone-600 text-sm">
              Nenhuma venda registrada este mês.
            </div>
          ) : (
            <div className="space-y-3">
              {topProdutos.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <div>
                    <div className="font-bold text-stone-900 text-sm">{p.nome}</div>
                    <div className="text-xs text-stone-500">{p.quantidade} unidades vendidas</div>
                  </div>
                  <div className="text-right font-black text-stone-900 text-sm">
                    {formatarCentavosParaReal(p.total)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
