import { prisma } from "@/lib/prisma";

export async function recalcularFichasPorIngrediente(
  ingredienteId: string,
  novoPrecoEmbalagem: number,
  novoTamanhoEmbalagem: number,
  novaUnidadeMedida: "KG" | "UNIDADE"
) {
  if (!ingredienteId) return;

  const itens = await prisma.itemFicha.findMany({
    where: { ingredienteId },
  });

  if (itens.length === 0) return;

  const tamanho = novoTamanhoEmbalagem > 0 ? novoTamanhoEmbalagem : 1;

  for (const item of itens) {
    const proporcao = item.quantidade / tamanho;
    const custoCalculado = Math.round(novoPrecoEmbalagem * proporcao);

    await prisma.itemFicha.update({
      where: { id: item.id },
      data: {
        precoEmbalagem: novoPrecoEmbalagem,
        tamanhoEmbalagem: novoTamanhoEmbalagem,
        unidadeMedida: novaUnidadeMedida,
        custoCalculado,
      },
    });
  }
}
