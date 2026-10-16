import { prisma } from "@/lib/prisma";
import { formatarCentavosParaReal, formatarDataPtBr } from "@/lib/formatadores";
import Link from "next/link";
import { Plus, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import ModalPagamentoVenda from "./ModalPagamentoVenda";

export const dynamic = "force-dynamic";

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; clienteId?: string }>;
}) {
  const params = await searchParams;
  const statusFiltro = params.status;
  const clienteIdFiltro = params.clienteId;

  const vendas = await prisma.venda.findMany({
    where: {
      ...(clienteIdFiltro ? { clienteId: clienteIdFiltro } : {}),
    },
    orderBy: { data: "desc" },
    include: {
      cliente: true,
      itens: {
        include: { produto: true },
      },
      pagamentos: true,
      criadoPor: true,
    },
  });

  const vendasCalculadas = vendas.map((v) => {
    const total = v.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
    const pago = v.pagamentos.reduce((acc, p) => acc + p.valor, 0);
    const saldo = Math.max(0, total - pago);

    let statusCalculado: "PAGO" | "PARCIAL" | "PENDENTE" = "PENDENTE";
    if (pago >= total && total > 0) statusCalculado = "PAGO";
    else if (pago > 0 && pago < total) statusCalculado = "PARCIAL";

    return {
      ...v,
      total,
      pago,
      saldo,
      statusCalculado,
    };
  });

  const vendasFiltradas = statusFiltro
    ? vendasCalculadas.filter((v) => v.statusCalculado === statusFiltro)
    : vendasCalculadas;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Vendas e Fiados
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Histórico completo de pedidos, entregas e controle de recebimentos
          </p>
        </div>

        <Link
          href="/vendas/nova"
          className="inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-black text-white font-bold py-3 px-5 rounded-xl shadow-md transition text-sm w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Lançar Nova Venda
        </Link>
      </div>

      {/* Filtros em Pílulas Responsivas com Rolagem Horizontal se Necessário */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Link
          href="/vendas"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            !statusFiltro ? "bg-stone-900 text-white shadow-xs" : "bg-white text-stone-700 border hover:bg-stone-50"
          }`}
        >
          Todas ({vendasCalculadas.length})
        </Link>
        <Link
          href="/vendas?status=PENDENTE"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            statusFiltro === "PENDENTE"
              ? "bg-rose-700 text-white shadow-xs"
              : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
          }`}
        >
          Fiado / Pendente ({vendasCalculadas.filter((v) => v.statusCalculado === "PENDENTE").length})
        </Link>
        <Link
          href="/vendas?status=PARCIAL"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            statusFiltro === "PARCIAL"
              ? "bg-stone-800 text-white shadow-xs"
              : "bg-white text-stone-800 border border-stone-200 hover:bg-stone-50"
          }`}
        >
          Parcial ({vendasCalculadas.filter((v) => v.statusCalculado === "PARCIAL").length})
        </Link>
        <Link
          href="/vendas?status=PAGO"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            statusFiltro === "PAGO"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          Quitadas ({vendasCalculadas.filter((v) => v.statusCalculado === "PAGO").length})
        </Link>
      </div>

      {/* Visualização Mobile: Cards Otimizados */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {vendasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-stone-500 bg-white rounded-2xl border">
            Nenhuma venda encontrada para os filtros selecionados.
          </div>
        ) : (
          vendasFiltradas.map((v) => (
            <div
              key={v.id}
              className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/clientes/${v.clienteId}`} className="font-bold text-stone-900 text-base hover:underline">
                    {v.cliente.nome}
                  </Link>
                  <span className="block text-xs text-stone-500 font-medium">
                    {formatarDataPtBr(v.data)}
                  </span>
                </div>

                <div>
                  {v.statusCalculado === "PAGO" && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                    </span>
                  )}
                  {v.statusCalculado === "PARCIAL" && (
                    <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-800 text-xs font-bold px-2 py-0.5 rounded-full border border-stone-200">
                      <Clock className="w-3.5 h-3.5" /> Parcial
                    </span>
                  )}
                  {v.statusCalculado === "PENDENTE" && (
                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" /> Fiado
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                {v.itens.map((i) => `${i.quantidade}x ${i.produto.nome}`).join(", ")}
                {v.observacoes && (
                  <span className="block text-stone-500 italic mt-1">"{v.observacoes}"</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] text-stone-500 block uppercase font-bold">Total</span>
                  <span className="font-black text-stone-900 text-base">
                    {formatarCentavosParaReal(v.total)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-stone-500 block uppercase font-bold">Saldo</span>
                  {v.saldo > 0 ? (
                    <span className="font-black text-rose-700 text-base">
                      {formatarCentavosParaReal(v.saldo)}
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold text-xs">Quitado</span>
                  )}
                </div>
              </div>

              {v.saldo > 0 && (
                <div className="pt-2 border-t flex justify-end">
                  <ModalPagamentoVenda
                    vendaId={v.id}
                    clienteNome={v.cliente.nome}
                    saldoDevedor={v.saldo}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Visualização Desktop: Tabela Completa */}
      <div className="hidden md:block bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b text-stone-500 font-semibold text-xs">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Bolos / Itens</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-right">Saldo Devedor</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {vendasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500">
                    Nenhuma venda encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                vendasFiltradas.map((v) => (
                  <tr key={v.id} className="hover:bg-stone-50">
                    <td className="p-4 text-stone-900 font-medium">
                      {formatarDataPtBr(v.data)}
                      {v.dataPrevistaPgto && (
                        <span className="block text-xs text-rose-600 font-normal">
                          Previsto: {formatarDataPtBr(v.dataPrevistaPgto)}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-stone-900">
                      <Link href={`/clientes/${v.clienteId}`} className="hover:underline">
                        {v.cliente.nome}
                      </Link>
                    </td>
                    <td className="p-4 text-xs text-stone-700 max-w-xs">
                      {v.itens.map((i) => `${i.quantidade}x ${i.produto.nome}`).join(", ")}
                      {v.observacoes && (
                        <span className="block text-stone-500 italic mt-0.5">
                          "{v.observacoes}"
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-black text-stone-900">
                      {formatarCentavosParaReal(v.total)}
                    </td>
                    <td className="p-4 text-right">
                      {v.saldo > 0 ? (
                        <span className="font-black text-rose-700">
                          {formatarCentavosParaReal(v.saldo)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold text-xs">Quitado</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {v.statusCalculado === "PAGO" && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                        </span>
                      )}
                      {v.statusCalculado === "PARCIAL" && (
                        <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-800 text-xs font-bold px-2.5 py-1 rounded-full border border-stone-200">
                          <Clock className="w-3.5 h-3.5" /> Parcial
                        </span>
                      )}
                      {v.statusCalculado === "PENDENTE" && (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5" /> Fiado
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {v.saldo > 0 && (
                        <ModalPagamentoVenda
                          vendaId={v.id}
                          clienteNome={v.cliente.nome}
                          saldoDevedor={v.saldo}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
