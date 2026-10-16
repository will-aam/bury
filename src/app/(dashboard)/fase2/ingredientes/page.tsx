import { prisma } from "@/lib/prisma";
import GestaoIngredientesEFichas from "./GestaoIngredientesEFichas";

export const dynamic = "force-dynamic";

export default async function IngredientesPage() {
  const [ingredientes, produtos] = await Promise.all([
    prisma.ingrediente.findMany({
      orderBy: { nome: "asc" },
      include: {
        historicoPrecos: {
          orderBy: { dataRegistro: "desc" },
        },
      },
    }),
    prisma.produto.findMany({
      orderBy: { nome: "asc" },
      include: {
        fichaTecnica: {
          include: {
            itens: true,
          },
        },
      },
    }),
  ]);

  return (
    <GestaoIngredientesEFichas
      ingredientes={ingredientes as any}
      produtos={produtos as any}
    />
  );
}
