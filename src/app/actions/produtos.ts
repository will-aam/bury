"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function criarProdutoAction(formData: FormData) {
  const nome = (formData.get("nome") as string)?.trim();
  const precoStr = formData.get("preco") as string;
  const rendimento = parseInt(formData.get("rendimento") as string) || 1;

  if (!nome || !precoStr) {
    return { erro: "Nome e preço são obrigatórios." };
  }

  const precoCentavos = Math.round(parseFloat(precoStr.replace(",", ".")) * 100);

  try {
    await prisma.produto.create({
      data: {
        nome,
        precoVenda: precoCentavos,
        rendimento,
      },
    });

    revalidatePath("/produtos");
    revalidatePath("/vendas/nova");
    return { sucesso: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { erro: "Já existe um produto com este nome cadastrado." };
    }
    return { erro: "Erro ao cadastrar produto." };
  }
}

export async function editarProdutoAction(formData: FormData) {
  const id = formData.get("id") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const precoStr = formData.get("preco") as string;
  const rendimento = parseInt(formData.get("rendimento") as string) || 1;

  if (!id || !nome || !precoStr) {
    return { erro: "Dados incompletos." };
  }

  const precoCentavos = Math.round(parseFloat(precoStr.replace(",", ".")) * 100);

  try {
    await prisma.produto.update({
      where: { id },
      data: {
        nome,
        precoVenda: precoCentavos,
        rendimento,
      },
    });

    revalidatePath("/produtos");
    revalidatePath("/vendas/nova");
    return { sucesso: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { erro: "Já existe outro produto com este nome." };
    }
    return { erro: "Erro ao editar produto." };
  }
}

export async function alternarStatusProdutoAction(formData: FormData) {
  const id = formData.get("id") as string;
  const statusAtual = formData.get("ativo") === "true";

  await prisma.produto.update({
    where: { id },
    data: { ativo: !statusAtual },
  });

  revalidatePath("/produtos");
  revalidatePath("/vendas/nova");
  return { sucesso: true };
}

export async function excluirProdutoAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { erro: "ID inválido." };

  // Verificar se o produto já possui histórico de vendas
  const vendasComProduto = await prisma.itemVenda.count({
    where: { produtoId: id },
  });

  if (vendasComProduto > 0) {
    // Regra de integridade: Inativação lógica para não corromper histórico contábil
    await prisma.produto.update({
      where: { id },
      data: { ativo: false },
    });
    revalidatePath("/produtos");
    revalidatePath("/vendas/nova");
    return { 
      sucesso: true, 
      aviso: "O produto já possui vendas no histórico. Ele foi desativado para manter seus relatórios e livro-caixa consistentes." 
    };
  }

  try {
    await prisma.produto.delete({
      where: { id },
    });

    revalidatePath("/produtos");
    revalidatePath("/vendas/nova");
    return { sucesso: true };
  } catch (error) {
    return { erro: "Erro ao excluir produto." };
  }
}
