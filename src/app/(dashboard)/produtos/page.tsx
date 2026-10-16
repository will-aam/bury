import { prisma } from "@/lib/prisma";
import ListaEFormularioProdutos from "./ListaEFormularioProdutos";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const produtos = await prisma.produto.findMany({
    orderBy: { nome: "asc" },
    include: {
      fichaTecnica: {
        include: {
          itens: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Título da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Produtos e Preços de Venda
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Gestão de cardápio com preços flexíveis para venda direta e parceiros/revendedores
          </p>
        </div>
      </div>

      <ListaEFormularioProdutos produtosIniciais={produtos} />
    </div>
  );
}
