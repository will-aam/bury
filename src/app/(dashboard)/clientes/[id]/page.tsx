import { prisma } from "@/lib/prisma";
import { formatarCentavosParaReal, formatarDataPtBr } from "@/lib/formatadores";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Phone, MapPin, FileText, AlertCircle, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DetalheClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      vendas: {
        orderBy: { data: "desc" },
        include: {
          itens: { include: { produto: true } },
          pagamentos: true,
        },
      },
    },
  });

  if (!cliente) {
    notFound();
  }

  // Cálculos de métricas do cliente
  let totalVendido = 0;
  let totalRecebido = 0;

  for (const v of cliente.vendas) {
    const totalVenda = v.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
    const totalPago = v.pagamentos.reduce((acc, p) => acc + p.valor, 0);
    totalVendido += totalVenda;
    totalRecebido += totalPago;
  }

  const saldoDevedor = Math.max(0, totalVendido - totalRecebido);
  const totalPedidos = cliente.vendas.length;
  const ticketMedio = totalPedidos > 0 ? Math.round(totalVendido / totalPedidos) : 0;
  const ultimaCompra = cliente.vendas[0]?.data;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Clientes
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <User className="w-7 h-7 text-amber-600" />
              {cliente.nome}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              {cliente.tipo === "REVENDEDOR" ? "Revendedor / Ponto de Venda" : "Consumidor Final"}
            </p>
          </div>

          <Link
            href="/vendas/nova"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow transition"
          >
            <ShoppingBag className="w-4 h-4" />
            Nova Venda para este Cliente
          </Link>
        </div>
      </div>

      {/* Cards de Métricas do Cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">Total Comprado</span>
          <div className="text-2xl font-black text-stone-900 mt-2">
            {formatarCentavosParaReal(totalVendido)}
          </div>
          <div className="text-xs text-stone-500 mt-1">{totalPedidos} pedidos feitos</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">Ticket Médio</span>
          <div className="text-2xl font-black text-stone-900 mt-2">
            {formatarCentavosParaReal(ticketMedio)}
          </div>
          <div className="text-xs text-stone-500 mt-1">Por pedido realizado</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">Última Compra</span>
          <div className="text-xl font-bold text-stone-900 mt-2">
            {ultimaCompra ? formatarDataPtBr(ultimaCompra) : "Nenhuma"}
          </div>
          <div className="text-xs text-stone-500 mt-1">Data mais recente</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm bg-rose-50/30">
          <span className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> Saldo Devedor
          </span>
          <div className="text-2xl font-black text-rose-700 mt-2">
            {formatarCentavosParaReal(saldoDevedor)}
          </div>
          <div className="text-xs text-rose-600 mt-1">
            {saldoDevedor > 0 ? "Possui fiados em aberto" : "Contas 100% em dia"}
          </div>
        </div>
      </div>

      {/* Dados Cadastrais */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <h2 className="text-base font-bold text-stone-900 mb-4">Informações de Contato e Entrega</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-stone-400 mt-1" />
            <div>
              <span className="text-xs text-stone-500 block">Telefone</span>
              <span className="font-semibold text-stone-900">{cliente.telefone || "Não informado"}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-stone-400 mt-1" />
            <div>
              <span className="text-xs text-stone-500 block">Endereço de Entrega</span>
              <span className="font-semibold text-stone-900">{cliente.endereco || "Não informado"}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-stone-400 mt-1" />
            <div>
              <span className="text-xs text-stone-500 block">Observações / Rotina</span>
              <span className="text-stone-700">{cliente.observacoes || "Nenhuma observação."}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Compras do Cliente */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-stone-900">Histórico de Vendas ({totalPedidos})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 font-semibold text-xs border-b">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Bolos</th>
                <th className="p-4 text-right">Valor Total</th>
                <th className="p-4 text-right">Valor Pago</th>
                <th className="p-4 text-right">Saldo Devedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cliente.vendas.map((v) => {
                const total = v.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
                const pago = v.pagamentos.reduce((acc, p) => acc + p.valor, 0);
                const saldo = Math.max(0, total - pago);

                return (
                  <tr key={v.id} className="hover:bg-stone-50">
                    <td className="p-4 font-medium text-stone-900">{formatarDataPtBr(v.data)}</td>
                    <td className="p-4 text-xs text-stone-700">
                      {v.itens.map((i) => `${i.quantidade}x ${i.produto.nome}`).join(", ")}
                    </td>
                    <td className="p-4 text-right font-black text-stone-900">
                      {formatarCentavosParaReal(total)}
                    </td>
                    <td className="p-4 text-right font-medium text-emerald-700">
                      {formatarCentavosParaReal(pago)}
                    </td>
                    <td className="p-4 text-right">
                      {saldo > 0 ? (
                        <span className="font-black text-rose-700">{formatarCentavosParaReal(saldo)}</span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600">Quitado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
