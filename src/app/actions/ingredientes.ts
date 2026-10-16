"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function criarIngredienteAction(formData: FormData) {
  const nome = (formData.get("nome") as string)?.trim();
  const unidadeBase = formData.get("unidadeBase") as any;
  const unidadeCompra = formData.get("unidadeCompra") as any;
  const tamanhoEmbalagem = parseFloat(formData.get("tamanhoEmbalagem") as string) || 1;
  const precoEmbalagemStr = formData.get("precoEmbalagem") as string;

  if (!nome || !precoEmbalagemStr) {
    return { erro: "Nome e preço da embalagem são obrigatórios." };
  }

  const precoEmbalagemCentavos = Math.round(parseFloat(precoEmbalagemStr.replace(",", ".")) * 100);

  let fatorMultiplicador = 1;
  if (unidadeCompra === "KG" && unidadeBase === "GRAMA") fatorMultiplicador = 1000;
  if (unidadeCompra === "L" && unidadeBase === "MILILITRO") fatorMultiplicador = 1000;

  const totalUnidadesBase = tamanhoEmbalagem * fatorMultiplicador;
  const custoUnidadeBase = precoEmbalagemCentavos / totalUnidadesBase;

  try {
    await prisma.$transaction(async (tx) => {
      const ing = await tx.ingrediente.create({
        data: {
          nome,
          unidadeBase,
        },
      });

      await tx.precoIngrediente.create({
        data: {
          ingredienteId: ing.id,
          unidadeCompra,
          tamanhoEmbalagem,
          precoEmbalagem: precoEmbalagemCentavos,
          custoUnidadeBase,
        },
      });
    });

    revalidatePath("/fase2/ingredientes");
    return { sucesso: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { erro: "Já existe um ingrediente com este nome." };
    }
    return { erro: "Erro ao cadastrar ingrediente." };
  }
}

export async function editarIngredienteAction(formData: FormData) {
  const id = formData.get("id") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const unidadeBase = formData.get("unidadeBase") as any;
  const unidadeCompra = formData.get("unidadeCompra") as any;
  const tamanhoEmbalagem = parseFloat(formData.get("tamanhoEmbalagem") as string) || 1;
  const precoEmbalagemStr = formData.get("precoEmbalagem") as string;

  if (!id || !nome || !precoEmbalagemStr) {
    return { erro: "Dados incompletos." };
  }

  const precoEmbalagemCentavos = Math.round(parseFloat(precoEmbalagemStr.replace(",", ".")) * 100);

  let fatorMultiplicador = 1;
  if (unidadeCompra === "KG" && unidadeBase === "GRAMA") fatorMultiplicador = 1000;
  if (unidadeCompra === "L" && unidadeBase === "MILILITRO") fatorMultiplicador = 1000;

  const totalUnidadesBase = tamanhoEmbalagem * fatorMultiplicador;
  const custoUnidadeBase = precoEmbalagemCentavos / totalUnidadesBase;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.ingrediente.update({
        where: { id },
        data: {
          nome,
          unidadeBase,
        },
      });

      // Cria um novo registro de preço preservando o histórico de compras e variações de preço
      await tx.precoIngrediente.create({
        data: {
          ingredienteId: id,
          unidadeCompra,
          tamanhoEmbalagem,
          precoEmbalagem: precoEmbalagemCentavos,
          custoUnidadeBase,
        },
      });
    });

    revalidatePath("/fase2/ingredientes");
    return { sucesso: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { erro: "Já existe outro ingrediente com este nome." };
    }
    return { erro: "Erro ao editar ingrediente." };
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
