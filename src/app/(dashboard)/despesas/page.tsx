import { prisma } from "@/lib/prisma";
import { formatarCentavosParaReal, formatarDataPtBr } from "@/lib/formatadores";
import { Receipt, Plus, Tag, CheckCircle2, AlertCircle } from "lucide-react";
import { revalidatePath } from "next/cache";
import { obterSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function criarDespesaAction(formData: FormData) {
  "use server";
  const sessao = await obterSessao();
  if (!sessao) return;

  const descricao = (formData.get("descricao") as string)?.trim();
  const categoriaId = formData.get("categoriaId") as string;
  const valorStr = formData.get("valor") as string;
  const status = formData.get("status") as "PAGO" | "PENDENTE";
  const dataStr = formData.get("data") as string;

  if (!descricao || !categoriaId || !valorStr) return;

  const valorCentavos = Math.round(parseFloat(valorStr.replace(",", ".")) * 100);
  const data = dataStr ? new Date(dataStr + "T12:00:00") : new Date();

  await prisma.despesa.create({
    data: {
      descricao,
      categoriaId,
      valor: valorCentavos,
      status: status || "PAGO",
      data,
      criadoPorId: sessao.usuarioId,
    },
  });

  revalidatePath("/despesas");
  revalidatePath("/");
}

async function criarCategoriaAction(formData: FormData) {
  "use server";
  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return;

  await prisma.categoriaDespesa.upsert({
    where: { nome },
    update: {},
    create: { nome },
  });

  revalidatePath("/despesas");
}

export default async function DespesasPage() {
  const [despesas, categorias] = await Promise.all([
    prisma.despesa.findMany({
      orderBy: { data: "desc" },
      include: {
        categoria: true,
        criadoPor: true,
      },
    }),
    prisma.categoriaDespesa.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Despesas e Gastos Operacionais
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Controle de supermercado, embalagens, transporte, gás e manutenção
          </p>
        </div>

        <div className="bg-white px-4 sm:px-5 py-3 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between sm:block text-left sm:text-right">
          <span className="text-[11px] font-bold text-stone-500 uppercase block">Total Geral Lançado</span>
          <span className="text-xl sm:text-2xl font-black text-rose-700">{formatarCentavosParaReal(totalDespesas)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Lançamento de Despesa */}
        <div className="space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-stone-700" />
              Lançar Nova Despesa
            </h2>

            <form action={criarDespesaAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Descrição do Gasto
                </label>
                <input
                  type="text"
                  name="descricao"
                  required
                  placeholder="Ex: Compra ovos e farinha"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Categoria
                </label>
                <select
                  name="categoriaId"
                  required
                  className="w-full px-3 py-2.5 border rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none"
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    name="valor"
                    required
                    placeholder="Ex: 85,50"
                    className="w-full px-3 py-2.5 border rounded-xl text-sm font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    name="data"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2.5 border rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue="PAGO"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm text-stone-900"
                >
                  <option value="PAGO">Pago</option>
                  <option value="PENDENTE">A Pagar (Pendente)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow"
              >
                Salvar Despesa
              </button>
            </form>
          </div>

          {/* Adicionar Categoria Rápida */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
            <h3 className="text-xs font-bold text-stone-700 uppercase mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-stone-700" />
              Adicionar Nova Categoria
            </h3>
            <form action={criarCategoriaAction} className="flex gap-2">
              <input
                type="text"
                name="nome"
                required
                placeholder="Ex: Impostos, Água..."
                className="flex-1 px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-stone-900"
              />
              <button
                type="submit"
                className="bg-stone-900 hover:bg-black text-white font-bold text-xs px-3 py-2 rounded-xl transition"
              >
                Criar
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Despesas (Cards Mobile / Tabela Desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-stone-700" />
            Lançamentos de Despesas ({despesas.length})
          </h2>

          {/* Cards Mobile */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {despesas.length === 0 ? (
              <div className="p-8 text-center text-stone-500 bg-white rounded-2xl border">
                Nenhuma despesa cadastrada ainda.
              </div>
            ) : (
              despesas.map((d) => (
                <div
                  key={d.id}
                  className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-stone-900 text-sm">{d.descricao}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full font-medium">
                        {d.categoria.nome}
                      </span>
                      <span className="text-[11px] text-stone-500">{formatarDataPtBr(d.data)}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-base font-black text-rose-700">
                      {formatarCentavosParaReal(d.valor)}
                    </div>
                    <div>
                      {d.status === "PAGO" ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Pago
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tabela Desktop */}
          <div className="hidden md:block bg-white p-6 rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-stone-500 font-semibold text-xs">
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Descrição</th>
                    <th className="pb-3">Categoria</th>
                    <th className="pb-3 text-right">Valor</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {despesas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-stone-500">
                        Nenhuma despesa cadastrada ainda.
                      </td>
                    </tr>
                  ) : (
                    despesas.map((d) => (
                      <tr key={d.id} className="hover:bg-stone-50">
                        <td className="py-3 font-medium text-stone-900">
                          {formatarDataPtBr(d.data)}
                        </td>
                        <td className="py-3 font-semibold text-stone-900">
                          {d.descricao}
                        </td>
                        <td className="py-3">
                          <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full text-xs">
                            {d.categoria.nome}
                          </span>
                        </td>
                        <td className="py-3 text-right font-black text-rose-700">
                          {formatarCentavosParaReal(d.valor)}
                        </td>
                        <td className="py-3 text-center">
                          {d.status === "PAGO" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-stone-800 text-xs font-bold bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                              <AlertCircle className="w-3.5 h-3.5" /> Pendente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
