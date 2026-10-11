import { prisma } from "@/lib/prisma";
import { formatarCentavosParaReal } from "@/lib/formatadores";
import Link from "next/link";
import { Cake, Plus, CheckCircle, XCircle } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function criarProdutoAction(formData: FormData) {
  "use server";
  const nome = (formData.get("nome") as string)?.trim();
  const precoStr = formData.get("preco") as string;
  const rendimento = parseInt(formData.get("rendimento") as string) || 1;

  if (!nome || !precoStr) return;

  const precoCentavos = Math.round(parseFloat(precoStr.replace(",", ".")) * 100);

  await prisma.produto.create({
    data: {
      nome,
      precoVenda: precoCentavos,
      rendimento,
    },
  });

  revalidatePath("/produtos");
}

async function alternarStatusProdutoAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const statusAtual = formData.get("ativo") === "true";

  await prisma.produto.update({
    where: { id },
    data: { ativo: !statusAtual },
  });

  revalidatePath("/produtos");
}

export default async function ProdutosPage() {
  const produtos = await prisma.produto.findMany({
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Produtos e Preços de Venda
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Cadastre bolos tradicionais, bolos BB e outros doces com preço unitário fixado
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Novo Produto */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            Cadastrar Novo Produto
          </h2>

          <form action={criarProdutoAction} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Nome do Produto / Sabor
              </label>
              <input
                type="text"
                name="nome"
                required
                placeholder="Ex: Bolo de Cenoura com Chocolate"
                className="w-full px-3 py-2 border rounded-lg text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Preço de Venda (R$)
                </label>
                <input
                  type="text"
                  name="preco"
                  required
                  placeholder="Ex: 30,00"
                  className="w-full px-3 py-2 border rounded-lg text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Rendimento
                </label>
                <input
                  type="number"
                  name="rendimento"
                  defaultValue="1"
                  min="1"
                  className="w-full px-3 py-2 border rounded-lg text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition"
            >
              Salvar Produto
            </button>
          </form>
        </div>

        {/* Listagem de Produtos */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Cake className="w-5 h-5 text-amber-600" />
            Produtos Cadastrados ({produtos.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-stone-500 font-semibold text-xs">
                  <th className="pb-3">Produto</th>
                  <th className="pb-3 text-right">Preço de Venda</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {produtos.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="py-3 font-semibold text-stone-900">
                      {p.nome}
                      {p.nome.includes("BB") && (
                        <span className="ml-2 inline-block px-2 py-0.5 bg-amber-100 text-amber-900 text-xs rounded-full font-bold">
                          BB (Pequeno)
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right font-black text-stone-900">
                      {formatarCentavosParaReal(p.precoVenda)}
                    </td>
                    <td className="py-3 text-center">
                      {p.ativo ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-stone-500 text-xs font-bold bg-stone-100 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <form action={alternarStatusProdutoAction} className="inline-block">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="ativo" value={p.ativo ? "true" : "false"} />
                        <button
                          type="submit"
                          className="text-xs font-bold text-stone-600 hover:text-stone-900 underline"
                        >
                          {p.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
