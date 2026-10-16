"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface ItemFichaInput {
  nomeInsumo: string;
  unidadeMedida: "KG" | "UNIDADE";
  precoEmbalagem: number; // centavos
  tamanhoEmbalagem: number; // peso total ou unidades do pacote
  quantidade: number; // quantidade gasta na receita
}

export async function salvarFichaTecnicaAction(
  produtoId: string,
  itens: ItemFichaInput[],
  observacoes?: string
) {
  if (!produtoId) {
    return { erro: "ID do produto inválido." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Busca ou cria a ficha técnica para o produto
      let ficha = await tx.fichaTecnica.findUnique({
        where: { produtoId },
      });

      if (!ficha) {
        ficha = await tx.fichaTecnica.create({
          data: {
            produtoId,
            observacoes: observacoes || null,
          },
        });
      } else if (observacoes !== undefined) {
        await tx.fichaTecnica.update({
          where: { id: ficha.id },
          data: { observacoes: observacoes || null },
        });
      }

      // 2. Remove itens antigos
      await tx.itemFicha.deleteMany({
        where: { fichaTecnicaId: ficha.id },
      });

      // 3. Insere os novos itens com custo calculado
      for (const item of itens) {
        const nomeInsumo = item.nomeInsumo?.trim();
        if (!nomeInsumo) continue;

        const tamanho = item.tamanhoEmbalagem > 0 ? item.tamanhoEmbalagem : 1;
        const proporcao = item.quantidade / tamanho;
        const custoCalculado = Math.round(item.precoEmbalagem * proporcao);

        await tx.itemFicha.create({
          data: {
            fichaTecnicaId: ficha.id,
            nomeInsumo,
            unidadeMedida: item.unidadeMedida === "UNIDADE" ? "UNIDADE" : "KG",
            precoEmbalagem: item.precoEmbalagem,
            tamanhoEmbalagem: item.tamanhoEmbalagem,
            quantidade: item.quantidade,
            custoCalculado,
          },
        });
      }
    });

    revalidatePath("/produtos");
    revalidatePath("/fase2/ingredientes");
    revalidatePath("/vendas/nova");
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao salvar ficha técnica:", error);
    return { erro: "Não foi possível salvar a ficha técnica." };
  }
}
