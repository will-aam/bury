"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { obterSessao } from "@/lib/auth";
import { recalcularFichasPorIngrediente } from "@/lib/fichas";

export async function criarDespesaAction(formData: FormData) {
  const sessao = await obterSessao();
  if (!sessao) {
    return { erro: "Não autenticado." };
  }

  const descricao = (formData.get("descricao") as string)?.trim();
  const categoriaId = formData.get("categoriaId") as string;
  const valorStr = formData.get("valor") as string;
  const quantidadeStr = (formData.get("quantidade") as string)?.trim();
  const status = formData.get("status") as "PAGO" | "PENDENTE";
  const dataStr = formData.get("data") as string;
  const ingredienteId = (formData.get("ingredienteId") as string)?.trim() || null;

  if (!descricao || !categoriaId || !valorStr) {
    return { erro: "Preencha os campos obrigatórios." };
  }

  const valorCentavos = Math.round(parseFloat(valorStr.replace(",", ".")) * 100);
  if (isNaN(valorCentavos) || valorCentavos < 0) {
    return { erro: "Valor inválido." };
  }

  const quantidade = quantidadeStr ? parseFloat(quantidadeStr.replace(",", ".")) : 1;
  const quantidadeFinal = isNaN(quantidade) || quantidade <= 0 ? 1 : quantidade;

  const data = dataStr ? new Date(dataStr + "T12:00:00") : new Date();

  try {
    await prisma.despesa.create({
      data: {
        descricao,
        categoriaId,
        quantidade: quantidadeFinal,
        valor: valorCentavos,
        status: status || "PAGO",
        data,
        criadoPorId: sessao.usuarioId,
        ingredienteId: ingredienteId || null,
      },
    });

    // Se a despesa estiver vinculada a um ingrediente, registra no histórico de preços e recalcula fichas
    if (ingredienteId) {
      const ing = await prisma.ingrediente.findUnique({
        where: { id: ingredienteId },
      });

      if (ing) {
        const unidadeCompra = ing.unidadeBase === "UNIDADE" ? "UNIDADE" : "KG";
        const totalUnidadesBase = unidadeCompra === "KG" ? quantidadeFinal * 1000 : quantidadeFinal;
        const custoUnidadeBase = valorCentavos / (totalUnidadesBase > 0 ? totalUnidadesBase : 1);

        await prisma.precoIngrediente.create({
          data: {
            ingredienteId,
            unidadeCompra: unidadeCompra as any,
            tamanhoEmbalagem: quantidadeFinal,
            precoEmbalagem: valorCentavos,
            custoUnidadeBase,
          },
        });

        await recalcularFichasPorIngrediente(
          ingredienteId,
          valorCentavos,
          quantidadeFinal,
          unidadeCompra
        );
      }
    }

    revalidatePath("/despesas");
    revalidatePath("/produtos");
    revalidatePath("/fase2/ingredientes");
    revalidatePath("/");
    revalidatePath("/relatorios");
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao criar despesa:", error);
    return { erro: "Erro ao registrar a despesa." };
  }
}

export async function editarDespesaAction(formData: FormData) {
  const sessao = await obterSessao();
  if (!sessao) {
    return { erro: "Não autenticado." };
  }

  const id = formData.get("id") as string;
  const descricao = (formData.get("descricao") as string)?.trim();
  const categoriaId = formData.get("categoriaId") as string;
  const valorStr = formData.get("valor") as string;
  const quantidadeStr = (formData.get("quantidade") as string)?.trim();
  const status = formData.get("status") as "PAGO" | "PENDENTE";
  const dataStr = formData.get("data") as string;
  const ingredienteId = (formData.get("ingredienteId") as string)?.trim() || null;

  if (!id || !descricao || !categoriaId || !valorStr) {
    return { erro: "Preencha todos os campos obrigatórios." };
  }

  const valorCentavos = Math.round(parseFloat(valorStr.replace(",", ".")) * 100);
  if (isNaN(valorCentavos) || valorCentavos < 0) {
    return { erro: "Valor inválido." };
  }

  const quantidade = quantidadeStr ? parseFloat(quantidadeStr.replace(",", ".")) : 1;
  const quantidadeFinal = isNaN(quantidade) || quantidade <= 0 ? 1 : quantidade;

  const data = dataStr ? new Date(dataStr + "T12:00:00") : new Date();

  try {
    await prisma.despesa.update({
      where: { id },
      data: {
        descricao,
        categoriaId,
        quantidade: quantidadeFinal,
        valor: valorCentavos,
        status: status || "PAGO",
        data,
        ingredienteId: ingredienteId || null,
      },
    });

    if (ingredienteId) {
      const ing = await prisma.ingrediente.findUnique({
        where: { id: ingredienteId },
      });

      if (ing) {
        const unidadeCompra = ing.unidadeBase === "UNIDADE" ? "UNIDADE" : "KG";
        const totalUnidadesBase = unidadeCompra === "KG" ? quantidadeFinal * 1000 : quantidadeFinal;
        const custoUnidadeBase = valorCentavos / (totalUnidadesBase > 0 ? totalUnidadesBase : 1);

        await prisma.precoIngrediente.create({
          data: {
            ingredienteId,
            unidadeCompra: unidadeCompra as any,
            tamanhoEmbalagem: quantidadeFinal,
            precoEmbalagem: valorCentavos,
            custoUnidadeBase,
          },
        });

        await recalcularFichasPorIngrediente(
          ingredienteId,
          valorCentavos,
          quantidadeFinal,
          unidadeCompra
        );
      }
    }

    revalidatePath("/despesas");
    revalidatePath("/produtos");
    revalidatePath("/fase2/ingredientes");
    revalidatePath("/");
    revalidatePath("/relatorios");
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao editar despesa:", error);
    return { erro: "Erro ao atualizar a despesa." };
  }
}

export async function excluirDespesaAction(formData: FormData) {
  const sessao = await obterSessao();
  if (!sessao) {
    return { erro: "Não autenticado." };
  }

  const id = formData.get("id") as string;
  if (!id) return { erro: "ID inválido." };

  try {
    await prisma.despesa.delete({
      where: { id },
    });

    revalidatePath("/despesas");
    revalidatePath("/");
    revalidatePath("/relatorios");
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao excluir despesa:", error);
    return { erro: "Erro ao excluir despesa." };
  }
}

export async function criarCategoriaAction(formData: FormData) {
  const sessao = await obterSessao();
  if (!sessao) {
    return { erro: "Não autenticado." };
  }

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { erro: "Nome da categoria obrigatório." };

  try {
    await prisma.categoriaDespesa.upsert({
      where: { nome },
      update: { ativo: true },
      create: { nome },
    });

    revalidatePath("/despesas");
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return { erro: "Erro ao salvar categoria." };
  }
}
