import { prisma } from "@/lib/prisma";
import FormularioVendaRapida from "./FormularioVendaRapida";

export const dynamic = "force-dynamic";

export default async function NovaVendaPage() {
  const [clientes, produtos] = await Promise.all([
    prisma.cliente.findMany({
      where: { ativo: true },
      orderBy: [{ isPadrao: "desc" }, { nome: "asc" }],
      select: { id: true, nome: true, isPadrao: true },
    }),
    prisma.produto.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, precoVenda: true },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Lançar Venda de Bolos
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Lançamento rápido e intuitivo para atendimento no balcão ou entrega a revendedores
        </p>
      </div>

      <FormularioVendaRapida clientes={clientes} produtos={produtos} />
    </div>
  );
}
