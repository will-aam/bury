import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Parser } from "json2csv";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get("ano") || "") || new Date().getFullYear();
  const mes = parseInt(searchParams.get("mes") || "") || new Date().getMonth() + 1;
  const clienteId = searchParams.get("clienteId") || undefined;

  const dataInicio = new Date(ano, mes - 1, 1);
  const dataFim = new Date(ano, mes, 0, 23, 59, 59);

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

  const linhas = [];

  for (const v of vendas) {
    const totalPago = v.pagamentos.reduce((acc, p) => acc + p.valor, 0);

    for (const item of v.itens) {
      linhas.push({
        Data: v.data.toISOString().split("T")[0],
        Cliente: v.cliente.nome,
        TipoCliente: v.cliente.tipo,
        Produto: item.produto.nome,
        Quantidade: item.quantidade,
        PrecoUnitarioReais: (item.precoUnitario / 100).toFixed(2),
        SubtotalReais: ((item.quantidade * item.precoUnitario) / 100).toFixed(2),
        TotalPagoReais: (totalPago / 100).toFixed(2),
        Observacoes: v.observacoes || "",
      });
    }
  }

  const parser = new Parser({ delimiter: ";" });
  const csv = parser.parse(linhas);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vendas-bolaria-${ano}-${mes}.csv"`,
    },
  });
}
