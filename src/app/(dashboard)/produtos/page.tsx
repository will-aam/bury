import { prisma } from "@/lib/prisma";
import { formatarCentavosParaReal } from "@/lib/formatadores";
import { Cake, Plus, CheckCircle, XCircle } from "lucide-react";
import { criarProdutoAction, alternarStatusProdutoAction } from "@/app/actions/produtos";
import ModalEditarProduto from "./ModalEditarProduto";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const produtos = await prisma.produto.findMany({
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Produtos e Preços de Venda
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Cadastre bolos tradicionais, bolos BB e doces com preço unitário fixado
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Novo Produto */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm h-fit">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            Cadastrar Novo Produto
          </h2>

          <form action={async (formData) => {
            "use server";
            await criarProdutoAction(formData);
          }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Nome do Bolo / Sabor
              </label>
              <input
                type="text"
                name="nome"
                required
                placeholder="Ex: Bolo de Cenoura com Chocolate"
                className="w-full px-3 py-2.5 border rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Preço Venda (R$)
                </label>
                <input
                  type="text"
                  name="preco"
                  required
                  placeholder="Ex: 30,00"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
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
                  className="w-full px-3 py-2.5 border rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow"
            >
              Salvar Produto
            </button>
          </form>
        </div>

        {/* Lista de Produtos (Cards Mobile / Tabela Desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
            <Cake className="w-5 h-5 text-amber-600" />
            Produtos Cadastrados ({produtos.length})
          </h2>

          {/* Cards Mobile */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {produtos.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-bold text-stone-900 text-sm">
                    {p.nome}
                    {p.nome.includes("BB") && (
                      <span className="ml-1.5 px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] rounded-full font-bold">
                        BB (Pequeno)
                      </span>
                    )}
                  </div>
                  <div className="text-base font-black text-stone-900">
                    {formatarCentavosParaReal(p.precoVenda)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ModalEditarProduto produto={p} />
                  <div>
                    {p.ativo ? (
                      <span className="text-emerald-700 text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-stone-500 text-[11px] font-bold bg-stone-100 px-2 py-0.5 rounded-full">
                        Inativo
                      </span>
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
                    <th className="pb-3">Produto</th>
                    <th className="pb-3 text-right">Preço de Venda</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Ações</th>
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
                        <div className="flex items-center justify-end gap-2">
                          <ModalEditarProduto produto={p} />
                          <form action={async (formData) => {
                            "use server";
                            await alternarStatusProdutoAction(formData);
                          }} className="inline-block">
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="ativo" value={p.ativo ? "true" : "false"} />
                            <button
                              type="submit"
                              className="text-xs font-bold text-stone-500 hover:text-stone-800 underline"
                            >
                              {p.ativo ? "Desativar" : "Ativar"}
                            </button>
                          </form>
                        </div>
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
