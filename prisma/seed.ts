import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // 1. Criar usuário Dona padrão se não existir
  const senhaDona = await bcrypt.hash("bolo1234", 10);
  const dona = await prisma.usuario.upsert({
    where: { email: "dona@bolaria.com" },
    update: {},
    create: {
      nome: "Dona da Bolaria",
      email: "dona@bolaria.com",
      senhaHash: senhaDona,
      role: "DONA",
    },
  });
  console.log("Usuária Dona criada/verificada:", dona.email);

  // 2. Criar cliente padrão "Consumidor avulso"
  const clientePadrao = await prisma.cliente.upsert({
    where: { nome: "Consumidor avulso" },
    update: {},
    create: {
      nome: "Consumidor avulso",
      tipo: "CONSUMIDOR_FINAL",
      observacoes: "Cliente padrão para vendas rápidas sem cadastro",
      isPadrao: true,
    },
  });
  console.log("Cliente padrão configurado:", clientePadrao.nome);

  // 3. Criar categorias iniciais de despesa
  const categorias = [
    "Supermercado / Ingredientes",
    "Embalagem e Etiqueta",
    "Transporte e Entregas",
    "Gás e Energia",
    "Manutenção e Equipamentos",
    "Outros Gastos",
  ];

  for (const cat of categorias) {
    await prisma.categoriaDespesa.upsert({
      where: { nome: cat },
      update: {},
      create: { nome: cat },
    });
  }
  console.log("Categorias de despesas cadastradas.");

  // 4. Cadastrar produtos comuns da bolaria
  const produtosExemplo = [
    { nome: "Bolo de Cenoura com Chocolate", precoVenda: 3000, rendimento: 1 },
    { nome: "Bolo de Chocolate Vulcão", precoVenda: 3500, rendimento: 1 },
    { nome: "Bolo Caseiro de Ovos / Tradicional", precoVenda: 2200, rendimento: 1 },
    { nome: "Bolo Mesclado", precoVenda: 2500, rendimento: 1 },
    { nome: "Bolo Formigueiro", precoVenda: 2500, rendimento: 1 },
    { nome: "Bolo de Fubá com Goiabada", precoVenda: 2600, rendimento: 1 },
    { nome: "Bolo de Coco Gelado", precoVenda: 2800, rendimento: 1 },
    { nome: "Bolo Caçarola Italiana", precoVenda: 3000, rendimento: 1 },
    { nome: "Bolo BB Cenoura (Pequeno)", precoVenda: 1500, rendimento: 1 },
    { nome: "Bolo BB Chocolate (Pequeno)", precoVenda: 1600, rendimento: 1 },
  ];

  for (const prod of produtosExemplo) {
    await prisma.produto.upsert({
      where: { nome: prod.nome },
      update: {},
      create: prod,
    });
  }
  console.log("Produtos padrão cadastrados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
