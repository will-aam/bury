"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function criarIngredienteAction(formData: FormData) {
  const nome = (formData.get("nome") as string)?.trim();
  const unidadeMedida = (formData.get("unidadeMedida") || formData.get("unidadeCompra") || "KG") as string;
  const quantidade = parseFloat((formData.get("quantidade") || formData.get("tamanhoEmbalagem") || "1") as string) || 1;
  const precoStr = (formData.get("preco") || formData.get("precoEmbalagem") || "") as string;

  if (!nome || !precoStr) {
    return { erro: "Nome e custo são obrigatórios." };
  }

  const precoCentavos = Math.round(parseFloat(precoStr.replace(",", ".")) * 100);
  const unidadeBase = unidadeMedida === "UNIDADE" ? "UNIDADE" : "GRAMA";
  const unidadeCompra = unidadeMedida === "UNIDADE" ? "UNIDADE" : "KG";

  const totalUnidadesBase = unidadeCompra === "KG" ? quantidade * 1000 : quantidade;
  const custoUnidadeBase = precoCentavos / (totalUnidadesBase > 0 ? totalUnidadesBase : 1);

  try {
    await prisma.$transaction(async (tx) => {
      const ing = await tx.ingrediente.create({
        data: {
          nome,
          unidadeBase: unidadeBase as any,
        },
      });

      await tx.precoIngrediente.create({
        data: {
          ingredienteId: ing.id,
          unidadeCompra: unidadeCompra as any,
          tamanhoEmbalagem: quantidade,
          precoEmbalagem: precoCentavos,
          custoUnidadeBase,
        },
      });
    });

    revalidatePath("/fase2/ingredientes");
    return { sucesso: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { erro: "Já existe um insumo com este nome." };
    }
    return { erro: "Erro ao cadastrar insumo." };
  }
}

export async function editarIngredienteAction(formData: FormData) {
  const id = formData.get("id") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const unidadeMedida = (formData.get("unidadeMedida") || formData.get("unidadeCompra") || "KG") as string;
  const quantidade = parseFloat((formData.get("quantidade") || formData.get("tamanhoEmbalagem") || "1") as string) || 1;
  const precoStr = (formData.get("preco") || formData.get("precoEmbalagem") || "") as string;

  if (!id || !nome || !precoStr) {
    return { erro: "Dados incompletos." };
  }

  const precoCentavos = Math.round(parseFloat(precoStr.replace(",", ".")) * 100);
  const unidadeBase = unidadeMedida === "UNIDADE" ? "UNIDADE" : "GRAMA";
  const unidadeCompra = unidadeMedida === "UNIDADE" ? "UNIDADE" : "KG";

  const totalUnidadesBase = unidadeCompra === "KG" ? quantidade * 1000 : quantidade;
  const custoUnidadeBase = precoCentavos / (totalUnidadesBase > 0 ? totalUnidadesBase : 1);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.ingrediente.update({
        where: { id },
        data: {
          nome,
          unidadeBase: unidadeBase as any,
        },
      });

      await tx.precoIngrediente.create({
        data: {
          ingredienteId: id,
          unidadeCompra: unidadeCompra as any,
          tamanhoEmbalagem: quantidade,
          precoEmbalagem: precoCentavos,
          custoUnidadeBase,
        },
      });
    });

    revalidatePath("/fase2/ingredientes");
    return { sucesso: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { erro: "Já existe outro insumo com este nome." };
    }
    return { erro: "Erro ao editar insumo." };
  }
}

export async function alternarStatusIngredienteAction(formData: FormData) {
  const id = formData.get("id") as string;
  const statusAtual = formData.get("ativo") === "true";

  await prisma.ingrediente.update({
    where: { id },
    data: { ativo: !statusAtual },
  });

  revalidatePath("/fase2/ingredientes");
  return { sucesso: true };
}

export async function excluirIngredienteAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { erro: "ID inválido." };

  const usadoEmFichas = await prisma.itemFicha.count({
    where: { ingredienteId: id },
  });

  if (usadoEmFichas > 0) {
    await prisma.ingrediente.update({
      where: { id },
      data: { ativo: false },
    });
    revalidatePath("/fase2/ingredientes");
    return { aviso: "Ingrediente já utilizado em fichas técnicas. Foi desativado para preservar os cálculos." };
  }

  await prisma.precoIngrediente.deleteMany({
    where: { ingredienteId: id },
  });

  await prisma.ingrediente.delete({
    where: { id },
  });

  revalidatePath("/fase2/ingredientes");
  return { sucesso: true };
}
