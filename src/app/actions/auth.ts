"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { criarSessao, destruirSessao, obterSessao } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const senha = formData.get("senha") as string;

  if (!email || !senha) {
    return { erro: "Preencha todos os campos." };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!usuario || !usuario.ativo) {
    return { erro: "E-mail ou senha incorretos." };
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    return { erro: "E-mail ou senha incorretos." };
  }

  await criarSessao({
    usuarioId: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role as "DONA" | "AJUDANTE",
  });

  redirect("/");
}

export async function logoutAction() {
  await destruirSessao();
  redirect("/login");
}
