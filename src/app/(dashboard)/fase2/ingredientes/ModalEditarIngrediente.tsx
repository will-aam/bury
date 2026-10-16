"use client";

import { useState, useTransition } from "react";
import { editarIngredienteAction, excluirIngredienteAction } from "@/app/actions/ingredientes";
import { formatarCentavosParaReal, formatarDataPtBr } from "@/lib/formatadores";
import { Edit2, Trash2, X, History, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PrecoHistorico {
  id: string;
  dataRegistro: Date | string;
  unidadeCompra: string;
  tamanhoEmbalagem: number;
  precoEmbalagem: number;
  custoUnidadeBase: number;
}

interface Ingrediente {
  id: string;
  nome: string;
  unidadeBase: string;
  ativo: boolean;
  historicoPrecos: PrecoHistorico[];
}

export default function ModalEditarIngrediente({
  ingrediente,
}: {
  ingrediente: Ingrediente;
}) {
  const [aberto, setAberto] = useState(false);
  const [aba, setAba] = useState<"editar" | "historico">("editar");

  const ultimoPreco = ingrediente.historicoPrecos[0];

  const [nome, setNome] = useState(ingrediente.nome);
  const [unidadeBase, setUnidadeBase] = useState(ingrediente.unidadeBase);
  const [unidadeCompra, setUnidadeCompra] = useState(ultimoPreco?.unidadeCompra || "KG");
  const [tamanhoEmbalagem, setTamanhoEmbalagem] = useState(ultimoPreco?.tamanhoEmbalagem?.toString() || "1");
  const [precoEmbalagem, setPrecoEmbalagem] = useState(
    ultimoPreco ? (ultimoPreco.precoEmbalagem / 100).toFixed(2) : ""
  );

  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Calcular em tempo real o novo custo unitário previsto
  const precoCentavos = Math.round(parseFloat(precoEmbalagem.replace(",", ".")) * 100) || 0;
  const tamNum = parseFloat(tamanhoEmbalagem) || 1;
  let mult = 1;
  if (unidadeCompra === "KG" && unidadeBase === "GRAMA") mult = 1000;
  if (unidadeCompra === "L" && unidadeBase === "MILILITRO") mult = 1000;
  const novoCustoBasePrevisto = tamNum * mult > 0 ? precoCentavos / (tamNum * mult) : 0;

  const custoAnterior = ultimoPreco?.custoUnidadeBase || 0;
  const variacaoPercentual =
    custoAnterior > 0 && novoCustoBasePrevisto > 0
      ? ((novoCustoBasePrevisto - custoAnterior) / custoAnterior) * 100
      : 0;

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const formData = new FormData();
    formData.append("id", ingrediente.id);
    formData.append("nome", nome);
    formData.append("unidadeBase", unidadeBase);
    formData.append("unidadeCompra", unidadeCompra);
    formData.append("tamanhoEmbalagem", tamanhoEmbalagem);
    formData.append("precoEmbalagem", precoEmbalagem);

    startTransition(async () => {
      const res = await editarIngredienteAction(formData);
      if (res?.erro) {
        setErro(res.erro);
      } else {
        setAberto(false);
      }
    });
  };

  const handleExcluir = () => {
    if (!confirm(`Deseja realmente apagar/desativar o ingrediente "${ingrediente.nome}"?`)) return;

    const formData = new FormData();
    formData.append("id", ingrediente.id);

    startTransition(async () => {
      const res = await excluirIngredienteAction(formData);
      if (res?.aviso) {
        alert(res.aviso);
      } else if (res?.erro) {
        alert(res.erro);
      }
      setAberto(false);
    });
  };

  return (
    <>
      <button
        onClick={() => {
          setAberto(true);
          setAba("editar");
        }}
        className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-stone-100 rounded-lg transition"
        title="Editar Ingrediente e Preço"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg">
                  {ingrediente.nome}
                </h3>
                <p className="text-xs text-stone-500">Atualização de dados e histórico de preços</p>
              </div>
              <button
                onClick={() => setAberto(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b border-stone-100 my-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAba("editar")}
                className={`py-2 px-4 border-b-2 transition ${
                  aba === "editar"
                    ? "border-amber-600 text-amber-600"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                Atualizar Preço / Cadastro
              </button>
              <button
                type="button"
                onClick={() => setAba("historico")}
                className={`py-2 px-4 border-b-2 transition flex items-center gap-1.5 ${
                  aba === "historico"
                    ? "border-amber-600 text-amber-600"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Variações de Preço ({ingrediente.historicoPrecos.length})
              </button>
            </div>

            {erro && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {erro}
              </div>
            )}

            {aba === "editar" ? (
              <form onSubmit={handleSalvar} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Nome do Ingrediente
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Unidade de Medida
                    </label>
                    <select
                      value={unidadeCompra === "UNIDADE" ? "UNIDADE" : "KG"}
                      onChange={(e) => {
                        setUnidadeCompra(e.target.value);
                        setUnidadeBase(e.target.value === "UNIDADE" ? "UNIDADE" : "GRAMA");
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-stone-900 bg-white"
                    >
                      <option value="KG">Quilo (kg)</option>
                      <option value="UNIDADE">Unidade (un)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={tamanhoEmbalagem}
                      onChange={(e) => setTamanhoEmbalagem(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900 font-medium"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Ex: 1 kg ou 30 un</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Custo (R$)
                  </label>
                  <input
                    type="text"
                    required
                    value={precoEmbalagem}
                    onChange={(e) => setPrecoEmbalagem(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-black text-amber-900 bg-amber-50/40 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Valor total pago por essa quantidade do insumo.
                  </p>
                </div>

                {/* Card de Simulação e Variação */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 font-medium">Custo por {unidadeBase.toLowerCase()}:</span>
                    <span className="font-extrabold text-stone-900 text-sm">
                      R$ {(novoCustoBasePrevisto / 100).toFixed(4)}
                    </span>
                  </div>

                  {custoAnterior > 0 && Math.abs(variacaoPercentual) >= 0.01 && (
                    <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                      <span className="text-stone-500 font-medium">Variação de Preço:</span>
                      <span
                        className={`font-black flex items-center gap-1 ${
                          variacaoPercentual > 0
                            ? "text-rose-600"
                            : variacaoPercentual < 0
                            ? "text-emerald-600"
                            : "text-stone-600"
                        }`}
                      >
                        {variacaoPercentual > 0 ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : variacaoPercentual < 0 ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                        {variacaoPercentual > 0 ? "+" : ""}
                        {variacaoPercentual.toFixed(1)}% em relação à última compra
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAberto(false)}
                    className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow transition"
                  >
                    {isPending ? "Salvando..." : "Salvar Novo Preço"}
                  </button>
                </div>
              </form>
            ) : (
              /* Aba de Histórico de Variações */
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {ingrediente.historicoPrecos.map((h, idx) => {
                  const custo = h.custoUnidadeBase;
                  const anterior = ingrediente.historicoPrecos[idx + 1]?.custoUnidadeBase;
                  const varPct = anterior ? ((custo - anterior) / anterior) * 100 : null;

                  return (
                    <div
                      key={h.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-stone-900">
                          {h.tamanhoEmbalagem} {h.unidadeCompra} = {formatarCentavosParaReal(h.precoEmbalagem)}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          Registrado em: {formatarDataPtBr(h.dataRegistro)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-amber-950">
                          R$ {(custo / 100).toFixed(4)} / {ingrediente.unidadeBase.toLowerCase()}
                        </div>
                        {varPct !== null && (
                          <span
                            className={`text-[10px] font-bold ${
                              varPct > 0 ? "text-rose-600" : varPct < 0 ? "text-emerald-600" : "text-stone-500"
                            }`}
                          >
                            {varPct > 0 ? `+${varPct.toFixed(1)}%` : `${varPct.toFixed(1)}%`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 mt-3 border-t flex justify-between items-center">
              <span className="text-[11px] text-stone-400">Ações adicionais:</span>
              <button
                type="button"
                onClick={handleExcluir}
                disabled={isPending}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Ingrediente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
