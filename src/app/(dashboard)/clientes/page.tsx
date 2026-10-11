import { prisma } from "@/lib/prisma";
import { formatarCentavosParaReal } from "@/lib/formatadores";
import Link from "next/link";
import { Users, Plus, AlertCircle, Eye, Phone, MapPin } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function criarClienteAction(formData: FormData) {
  "use server";
  const nome = (formData.get("nome") as string)?.trim();
  const tipo = formData.get("tipo") as "CONSUMIDOR_FINAL" | "REVENDEDOR";
  const telefone = (formData.get("telefone") as string)?.trim() || null;
  const endereco = (formData.get("endereco") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  if (!nome) return;

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
}

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
    include: {
      vendas: {
        include: {
          itens: true,
          pagamentos: true,
        },
      },
    },
  });

  const clientesComMetricas = clientes.map((c) => {
    let totalComprado = 0;
    let totalPago = 0;

    for (const v of c.vendas) {
      const valorVenda = v.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
      const valorPago = v.pagamentos.reduce((acc, p) => acc + p.valor, 0);
      totalComprado += valorVenda;
      totalPago += valorPago;
    }

    const saldoDevedor = Math.max(0, totalComprado - totalPago);

    return {
      ...c,
      totalComprado,
      saldoDevedor,
      totalVendas: c.vendas.length,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Clientes e Pontos de Venda
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Gerenciamento de clientes, revendedores recorrentes e saldos em aberto
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Novo Cliente */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm h-fit">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            Cadastrar Novo Cliente
          </h2>

          <form action={criarClienteAction} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Nome do Cliente / Ponto
              </label>
              <input
                type="text"
                name="nome"
                required
                placeholder="Ex: Mercearia do Zé ou Maria"
                className="w-full px-3 py-2.5 border rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Tipo
              </label>
              <select
                name="tipo"
                defaultValue="CONSUMIDOR_FINAL"
                className="w-full px-3 py-2.5 border rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="CONSUMIDOR_FINAL">Consumidor Final (Direto)</option>
                <option value="REVENDEDOR">Revendedor (Recorrente)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                name="telefone"
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2.5 border rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Endereço
              </label>
              <input
                type="text"
                name="endereco"
                placeholder="Rua, número, bairro"
                className="w-full px-3 py-2.5 border rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Observações
              </label>
              <textarea
                name="observacoes"
                rows={2}
                placeholder="Ex: Entrega terças e sextas..."
                className="w-full px-3 py-2.5 border rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow"
            >
              Salvar Cliente
            </button>
          </form>
        </div>

        {/* Lista de Clientes (Cards Mobile / Tabela Desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Lista de Clientes ({clientesComMetricas.length})
            </h2>
          </div>

          {/* Cards Mobile */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {clientesComMetricas.map((c) => (
              <div
                key={c.id}
                className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">
                      {c.nome}
                      {c.isPadrao && (
                        <span className="ml-2 inline-block px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] rounded-full">
                          Padrão
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.tipo === "REVENDEDOR" ? "bg-purple-50 text-purple-700" : "bg-stone-100 text-stone-600"
                      }`}>
                        {c.tipo === "REVENDEDOR" ? "Revendedor" : "Consumidor"}
                      </span>
                      {c.telefone && (
                        <span className="text-xs text-stone-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {c.telefone}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/clientes/${c.id}`}
                    className="p-2 text-stone-600 hover:text-stone-900 bg-stone-50 rounded-xl"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block font-semibold">Total Comprado</span>
                    <span className="font-bold text-stone-800 text-sm">
                      {formatarCentavosParaReal(c.totalComprado)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 uppercase block font-semibold">Saldo Devedor</span>
                    {c.saldoDevedor > 0 ? (
                      <span className="font-black text-rose-700 text-sm">
                        {formatarCentavosParaReal(c.saldoDevedor)}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold text-xs">Em dia</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabela Desktop */}
          <div className="hidden md:block bg-white p-6 rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-stone-500 font-semibold text-xs">
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3 text-right">Total Comprado</th>
                    <th className="pb-3 text-right">Saldo Devedor</th>
                    <th className="pb-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {clientesComMetricas.map((c) => (
                    <tr key={c.id} className="hover:bg-stone-50">
                      <td className="py-3 font-semibold text-stone-900">
                        {c.nome}
                        {c.isPadrao && (
                          <span className="ml-2 inline-block px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full">
                            Padrão
                          </span>
                        )}
                        {c.telefone && (
                          <span className="block text-xs font-normal text-stone-600">
                            {c.telefone}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-xs">
                        {c.tipo === "REVENDEDOR" ? (
                          <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-bold">
                            Revendedor
                          </span>
                        ) : (
                          <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full">
                            Consumidor
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right font-medium text-stone-700">
                        {formatarCentavosParaReal(c.totalComprado)}
                      </td>
                      <td className="py-3 text-right">
                        {c.saldoDevedor > 0 ? (
                          <span className="font-black text-rose-700 inline-flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {formatarCentavosParaReal(c.saldoDevedor)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold text-xs">Em dia</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/clientes/${c.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
