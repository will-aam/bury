"use server";

import { prisma } from "@/lib/prisma";
import { obterSessao } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface CriarVendaInput {
  clienteId: string;
  data: string;
  observacoes?: string;
  dataPrevistaPgto?: string;
  itens: {
    produtoId: string;
    quantidade: number;
    precoUnitario: number;
  }[];
  pagamento?: {
    valor: number;
    forma: "PIX" | "DINHEIRO" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "OUTRO";
  };
}

export async function criarVendaRapidaAction(input: CriarVendaInput) {
  const sessao = await obterSessao();
  if (!sessao) {
    return { erro: "Não autorizado." };
  }

  if (!input.clienteId || !input.itens || input.itens.length === 0) {
    return { erro: "Cliente e produtos são obrigatórios." };
  }

  try {
    const dataVenda = input.data ? new Date(input.data + "T12:00:00") : new Date();
    const dataPrevista = input.dataPrevistaPgto ? new Date(input.dataPrevistaPgto + "T12:00:00") : null;

    // Snapshot de custos das fichas técnicas (quando houver)
    const produtosIds = input.itens.map((i) => i.produtoId);
    const fichas = await prisma.fichaTecnica.findMany({
      where: { produtoId: { in: produtosIds } },
      include: {
        itens: {
          include: {
            ingrediente: {
              include: {
                historicoPrecos: {
                  orderBy: { dataRegistro: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Mapear custo unitário atual de cada produto
    const mapaCustos: Record<string, number> = {};
    for (const ficha of fichas) {
      let custoTotalFicha = 0;
      for (const item of ficha.itens) {
        const precoRecente = item.ingrediente.historicoPrecos[0];
        if (precoRecente) {
          custoTotalFicha += item.quantidade * precoRecente.custoUnidadeBase;
        }
      }
      mapaCustos[ficha.produtoId] = Math.round(custoTotalFicha);
    }

    // Criar Venda com Itens e Pagamento em transação
    const novaVenda = await prisma.$transaction(async (tx) => {
      const venda = await tx.venda.create({
        data: {
          clienteId: input.clienteId,
          data: dataVenda,
          dataPrevistaPgto: dataPrevista,
          observacoes: input.observacoes,
          criadoPorId: sessao.usuarioId,
          itens: {
            create: input.itens.map((item) => ({
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
              custoUnitario: mapaCustos[item.produtoId] || null,
            })),
          },
        },
      });

      if (input.pagamento && input.pagamento.valor > 0) {
        await tx.pagamento.create({
          data: {
            vendaId: venda.id,
            valor: input.pagamento.valor,
            forma: input.pagamento.forma,
            criadoPorId: sessao.usuarioId,
            data: dataVenda,
          },
        });
      }

      return venda;
    });

    revalidatePath("/");
    revalidatePath("/vendas");
    revalidatePath("/clientes");

    return { sucesso: true, vendaId: novaVenda.id };
  } catch (error: any) {
    console.error("Erro ao criar venda:", error);
    return { erro: "Ocorreu um erro ao salvar a venda." };
  }
}

export async function adicionarPagamentoVendaAction(formData: FormData) {
  const sessao = await obterSessao();
  if (!sessao) return { erro: "Não autorizado." };

  const vendaId = formData.get("vendaId") as string;
  const valorStr = formData.get("valor") as string;
  const forma = formData.get("forma") as any;

  if (!vendaId || !valorStr) return { erro: "Dados inválidos." };

  const valorCentavos = Math.round(parseFloat(valorStr.replace(",", ".")) * 100);

  // Verificar saldo restante da venda
  const venda = await prisma.venda.findUnique({
    where: { id: vendaId },
    include: { itens: true, pagamentos: true },
  });

  if (!venda) return { erro: "Venda não encontrada." };

  const totalVenda = venda.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
  const totalPago = venda.pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const saldoRestante = totalVenda - totalPago;

  if (valorCentavos > saldoRestante) {
    return { erro: "O valor informado é maior que o saldo em aberto da venda." };
  }

  await prisma.pagamento.create({
    data: {
      vendaId,
      valor: valorCentavos,
      forma: forma || "PIX",
      criadoPorId: sessao.usuarioId,
    },
  });

  revalidatePath("/vendas");
  revalidatePath("/");
  revalidatePath("/clientes");

  return { sucesso: true };
}
