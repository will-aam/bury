import { prisma } from "@/lib/prisma";
import { formatarCentavosParaReal } from "@/lib/formatadores";
import { Sliders, Plus, History } from "lucide-react";
import { revalidatePath } from "next/cache";

import ModalEditarIngrediente from "./ModalEditarIngrediente";
import { criarIngredienteAction } from "@/app/actions/ingredientes";

export const dynamic = "force-dynamic";

export default async function IngredientesPage() {
  const ingredientes = await prisma.ingrediente.findMany({
    orderBy: { nome: "asc" },
    include: {
      historicoPrecos: {
        orderBy: { dataRegistro: "desc" },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Ingredientes e Custo Unitário (Fase 2)
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Cadastro de insumos com conversão automática de embalagens (kg → g, l → ml) e histórico de variações de preço
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário Novo Ingrediente */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            Cadastrar Ingrediente
          </h2>

          <form action={async (formData) => {
            "use server";
            await criarIngredienteAction(formData);
          }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Nome do Ingrediente
              </label>
              <input
                type="text"
                name="nome"
                required
                placeholder="Ex: Farinha de Trigo Especial"
                className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Unidade Base
                </label>
                <select
                  name="unidadeBase"
                  defaultValue="GRAMA"
                  className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900"
                >
                  <option value="GRAMA">Grama (g)</option>
                  <option value="MILILITRO">Mililitro (ml)</option>
                  <option value="UNIDADE">Unidade (un)</option>
                  <option value="GOTA">Gota</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Unidade Compra
                </label>
                <select
                  name="unidadeCompra"
                  defaultValue="KG"
                  className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900"
                >
                  <option value="KG">Quilo (kg)</option>
                  <option value="G">Grama (g)</option>
                  <option value="L">Litro (l)</option>
                  <option value="ML">Mililitro (ml)</option>
                  <option value="UNIDADE">Unidade (un)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Tam. Embalagem
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="tamanhoEmbalagem"
                  defaultValue="1"
                  required
                  placeholder="Ex: 1 ou 5"
                  className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Preço Embalagem (R$)
                </label>
                <input
                  type="text"
                  name="precoEmbalagem"
                  required
                  placeholder="Ex: 5,49"
                  className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition"
            >
              Salvar Ingrediente
            </button>
          </form>
        </div>

        {/* Tabela de Ingredientes */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-600" />
            Ingredientes Cadastrados ({ingredientes.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-stone-500 font-semibold text-xs">
                  <th className="pb-3">Ingrediente</th>
                  <th className="pb-3">Unidade Base</th>
                  <th className="pb-3 text-right">Última Embalagem</th>
                  <th className="pb-3 text-right">Custo Un. Base</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ingredientes.map((i) => {
                  const preco = i.historicoPrecos[0];
                  return (
                    <tr key={i.id} className="hover:bg-stone-50">
                      <td className="py-3 font-semibold text-stone-900">
                        {i.nome}
                        {i.historicoPrecos.length > 1 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] rounded font-bold">
                            {i.historicoPrecos.length} preços
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-xs text-stone-600">{i.unidadeBase}</td>
                      <td className="py-3 text-right text-stone-700 text-xs">
                        {preco ? (
                          <>
                            {preco.tamanhoEmbalagem} {preco.unidadeCompra} ={" "}
                            <strong>{formatarCentavosParaReal(preco.precoEmbalagem)}</strong>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 text-right font-black text-amber-950">
                        {preco ? `R$ ${(preco.custoUnidadeBase / 100).toFixed(4)} / ${i.unidadeBase.toLowerCase()}` : "-"}
                      </td>
                      <td className="py-3 text-right">
                        <ModalEditarIngrediente ingrediente={i} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
