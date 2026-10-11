"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function criarClienteAction(formData: FormData) {
  const nome = (formData.get("nome") as string)?.trim();
  const tipo = formData.get("tipo") as "CONSUMIDOR_FINAL" | "REVENDEDOR";
  const telefone = (formData.get("telefone") as string)?.trim() || null;
  const endereco = (formData.get("endereco") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  if (!nome) {
    return { erro: "O nome do cliente é obrigatório." };
  }

  try {
    await prisma.cliente.create({
      data: {
        nome,
        tipo: tipo || "CONSUMIDOR_FINAL",
        telefone,
        endereco,
        observacoes,
      },
    });

    revalidatePath("/clientes");
    revalidatePath("/vendas/nova");
    return { sucesso: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { erro: "Já existe um cliente cadastrado com este nome." };
    }
    return { erro: "Erro ao cadastrar cliente." };
  }
}

export async function editarClienteAction(formData: FormData) {
  const id = formData.get("id") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const tipo = formData.get("tipo") as "CONSUMIDOR_FINAL" | "REVENDEDOR";
  const telefone = (formData.get("telefone") as string)?.trim() || null;
  const endereco = (formData.get("endereco") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  if (!id || !nome) {
    return { erro: "Dados incompletos." };
  }

  try {
    await prisma.cliente.update({
      where: { id },
      data: {
        nome,
        tipo: tipo || "CONSUMIDOR_FINAL",
        telefone,
        endereco,
        observacoes,
      },
    });

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    revalidatePath("/vendas/nova");
    return { sucesso: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { erro: "Já existe outro cliente com este nome." };
    }
    return { erro: "Erro ao editar cliente." };
  }
}

export async function alternarStatusClienteAction(formData: FormData) {
  const id = formData.get("id") as string;
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) return { erro: "Cliente não encontrado." };

  if (cliente.isPadrao) {
    return { erro: "O cliente padrão não pode ser desativado." };
  }

  await prisma.cliente.update({
    where: { id },
    data: { ativo: !cliente.ativo },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { sucesso: true };
}

export async function excluirClienteAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { erro: "ID inválido." };

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) return { erro: "Cliente não encontrado." };

  if (cliente.isPadrao) {
    return { erro: "O cliente padrão 'Consumidor avulso' não pode ser excluído." };
  }

  // Verificar se o cliente possui vendas
  const vendasDoCliente = await prisma.venda.count({
    where: { clienteId: id },
  });

  if (vendasDoCliente > 0) {
    // Inativação lógica obrigatória para preservar histórico contábil
    await prisma.cliente.update({
      where: { id },
      data: { ativo: false },
    });

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    revalidatePath("/vendas/nova");
    return { 
      sucesso: true, 
      aviso: "O cliente já possui vendas registradas. Ele foi desativado para manter seu histórico de caixa seguro." 
    };
  }

  try {
    await prisma.cliente.delete({
      where: { id },
    });

    revalidatePath("/clientes");
    revalidatePath("/vendas/nova");
    return { sucesso: true };
  } catch (error) {
    return { erro: "Erro ao excluir cliente." };
  }
}
