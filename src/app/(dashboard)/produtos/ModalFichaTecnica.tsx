"use client";

import { useState, useTransition } from "react";
import { formatarCentavosParaReal } from "@/lib/formatadores";
import { salvarFichaTecnicaAction } from "@/app/actions/fichaTecnica";
import {
  FileText,
  Plus,
  Trash2,
  X,
  Scale,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react";

export interface ItemFichaData {
  id?: string;
  nomeInsumo: string;
  unidadeMedida: "KG" | "UNIDADE" | string;
  precoEmbalagem: number; // centavos
  tamanhoEmbalagem: number;
  quantidade: number;
  custoCalculado: number; // centavos
}

export interface FichaTecnicaData {
  id?: string;
  observacoes?: string | null;
  itens: ItemFichaData[];
}

interface ModalFichaTecnicaProps {
  produto: {
    id: string;
    nome: string;
    rendimento: number;
    precoVenda: number;
    precoSecundario: number;
    fichaTecnica?: FichaTecnicaData | null;
  };
}

export default function ModalFichaTecnica({ produto }: ModalFichaTecnicaProps) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  // Inicializar itens da ficha
  const itensIniciais = produto.fichaTecnica?.itens?.map((i) => ({
    nomeInsumo: i.nomeInsumo,
    unidadeMedida: (i.unidadeMedida === "UNIDADE" ? "UNIDADE" : "KG") as "KG" | "UNIDADE",
    precoEmbalagemStr: (i.precoEmbalagem / 100).toFixed(2),
    tamanhoEmbalagemStr: i.tamanhoEmbalagem.toString(),
    quantidadeStr: i.quantidade.toString(),
  })) || [];

  const [itens, setItens] = useState<
    Array<{
      nomeInsumo: string;
      unidadeMedida: "KG" | "UNIDADE";
      precoEmbalagemStr: string;
      tamanhoEmbalagemStr: string;
      quantidadeStr: string;
    }>
  >(
    itensIniciais.length > 0
      ? itensIniciais
      : [
          {
            nomeInsumo: "",
            unidadeMedida: "KG",
            precoEmbalagemStr: "",
            tamanhoEmbalagemStr: "1",
            quantidadeStr: "",
          },
        ]
  );

  const [observacoes, setObservacoes] = useState(produto.fichaTecnica?.observacoes || "");

  // Manipular adição/remoção de linhas
  const adicionarLinha = () => {
    setItens([
      ...itens,
      {
        nomeInsumo: "",
        unidadeMedida: "KG",
        precoEmbalagemStr: "",
        tamanhoEmbalagemStr: "1",
        quantidadeStr: "",
      },
    ]);
  };

  const removerLinha = (idx: number) => {
    setItens(itens.filter((_, i) => i !== idx));
  };

  const atualizarItem = (
    idx: number,
    campo: "nomeInsumo" | "unidadeMedida" | "precoEmbalagemStr" | "tamanhoEmbalagemStr" | "quantidadeStr",
    valor: any
  ) => {
    const novos = [...itens];
    novos[idx] = { ...novos[idx], [campo]: valor };
    setItens(novos);
  };

  // Cálculos em tempo real da Ficha Técnica
  const itensCalculados = itens.map((i) => {
    const precoCentavos = Math.round(parseFloat(i.precoEmbalagemStr.replace(",", ".")) * 100) || 0;
    const tamanho = parseFloat(i.tamanhoEmbalagemStr.replace(",", ".")) || 1;
    const quantidade = parseFloat(i.quantidadeStr.replace(",", ".")) || 0;
    const custoItemCentavos = tamanho > 0 ? Math.round(precoCentavos * (quantidade / tamanho)) : 0;

    return {
      ...i,
      precoCentavos,
      tamanho,
      quantidade,
      custoItemCentavos,
    };
  });

  // Custo Total da Receita Inteira
  const custoTotalReceitaCentavos = itensCalculados.reduce((acc, i) => acc + i.custoItemCentavos, 0);

  // Custo Unitário do Produto (dividido pelo rendimento do bolo)
  const rendimento = produto.rendimento > 0 ? produto.rendimento : 1;
  const custoUnitarioCentavos = Math.round(custoTotalReceitaCentavos / rendimento);

  // Soma dos Volumes / Quantidades por tipo de unidade
  const unidadesUsadas = Array.from(new Set(itensCalculados.filter((i) => i.nomeInsumo.trim()).map((i) => i.unidadeMedida)));
  const todosMesmaUnidade = unidadesUsadas.length === 1;
  const unidadePrincipal = todosMesmaUnidade ? unidadesUsadas[0] : null;

  const somaVolumeTotal = itensCalculados
    .filter((i) => i.nomeInsumo.trim())
    .reduce((acc, i) => acc + i.quantidade, 0);

  const somaKg = itensCalculados
    .filter((i) => i.nomeInsumo.trim() && i.unidadeMedida === "KG")
    .reduce((acc, i) => acc + i.quantidade, 0);

  const somaUn = itensCalculados
    .filter((i) => i.nomeInsumo.trim() && i.unidadeMedida === "UNIDADE")
    .reduce((acc, i) => acc + i.quantidade, 0);

  // Salvar
  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    const itensParaSalvar = itensCalculados
      .filter((i) => i.nomeInsumo.trim())
      .map((i) => ({
        nomeInsumo: i.nomeInsumo.trim(),
        unidadeMedida: i.unidadeMedida,
        precoEmbalagem: i.precoCentavos,
        tamanhoEmbalagem: i.tamanho,
        quantidade: i.quantidade,
      }));

    startTransition(async () => {
      const res = await salvarFichaTecnicaAction(produto.id, itensParaSalvar, observacoes);
      if (res?.erro) {
        setErro(res.erro);
      } else {
        setSucesso(true);
        setTimeout(() => {
          setAberto(false);
          setSucesso(false);
        }, 800);
      }
    });
  };

  const temFichaPronta = (produto.fichaTecnica?.itens?.length || 0) > 0;

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
          temFichaPronta
            ? "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
            : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
        }`}
        title="Montar ou Editar Ficha Técnica e Custos"
      >
        <FileText className="w-3.5 h-3.5 text-amber-600" />
        {temFichaPronta ? "Ficha Técnica" : "+ Ficha Técnica"}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Topo do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-600" />
                  Ficha Técnica & Custo de Produção
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Produto: <strong className="text-stone-800">{produto.nome}</strong> • Rendimento da receita:{" "}
                  <strong>{produto.rendimento} un</strong>
                </p>
              </div>
              <button
                onClick={() => setAberto(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avisos */}
            {erro && (
              <div className="my-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="my-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                Ficha Técnica salva com sucesso!
              </div>
            )}

            {/* Conteúdo com scroll */}
            <form onSubmit={handleSalvar} className="flex-1 overflow-y-auto my-3 pr-1 space-y-4">
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <strong>Como funciona o cálculo:</strong> Para cada insumo, informe o preço que você pagou no produto inteiro (ex: 1 kg por R$ 5,00) e a quantidade gasta na receita (ex: 0,5 kg).
                </div>
                <div className="font-semibold text-amber-800 shrink-0">
                  Unidades suportadas: <strong>Quilo (kg)</strong> e <strong>Unidade (un)</strong>
                </div>
              </div>

              {/* Tabela de Insumos da Ficha */}
              <div className="border border-stone-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-600 font-bold uppercase tracking-wider border-b">
                    <tr>
                      <th className="p-3 min-w-[180px]">Insumo / Ingrediente</th>
                      <th className="p-3 w-32">Medida</th>
                      <th className="p-3 w-32">Preço Inteiro (R$)</th>
                      <th className="p-3 w-28">Tam. Pacote</th>
                      <th className="p-3 w-28">Qtd. na Receita</th>
                      <th className="p-3 text-right w-32">Custo Calculado</th>
                      <th className="p-3 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {itens.map((item, idx) => {
                      const calc = itensCalculados[idx];

                      return (
                        <tr key={idx} className="hover:bg-amber-50/20">
                          {/* Nome Insumo */}
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              placeholder="Ex: Farinha de Trigo"
                              value={item.nomeInsumo}
                              onChange={(e) => atualizarItem(idx, "nomeInsumo", e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-900 focus:ring-1 focus:ring-amber-500 outline-none"
                            />
                          </td>

                          {/* Unidade Medida */}
                          <td className="p-2">
                            <select
                              value={item.unidadeMedida}
                              onChange={(e) =>
                                atualizarItem(idx, "unidadeMedida", e.target.value as "KG" | "UNIDADE")
                              }
                              className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 focus:ring-1 focus:ring-amber-500 outline-none"
                            >
                              <option value="KG">Quilo (kg)</option>
                              <option value="UNIDADE">Unidade (un)</option>
                            </select>
                          </td>

                          {/* Preço Embalagem Inteira */}
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              placeholder="Ex: 5,00"
                              value={item.precoEmbalagemStr}
                              onChange={(e) => atualizarItem(idx, "precoEmbalagemStr", e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-900 focus:ring-1 focus:ring-amber-500 outline-none"
                            />
                          </td>

                          {/* Tamanho da Embalagem */}
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                required
                                placeholder="Ex: 1"
                                value={item.tamanhoEmbalagemStr}
                                onChange={(e) => atualizarItem(idx, "tamanhoEmbalagemStr", e.target.value)}
                                className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:ring-1 focus:ring-amber-500 outline-none"
                              />
                              <span className="text-[10px] text-stone-400 font-bold">
                                {item.unidadeMedida === "KG" ? "kg" : "un"}
                              </span>
                            </div>
                          </td>

                          {/* Quantidade Usada na Receita */}
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                required
                                placeholder={item.unidadeMedida === "KG" ? "Ex: 0.5" : "Ex: 3"}
                                value={item.quantidadeStr}
                                onChange={(e) => atualizarItem(idx, "quantidadeStr", e.target.value)}
                                className="w-full px-2 py-1.5 bg-amber-50/50 border border-amber-300 rounded-lg text-xs font-bold text-amber-950 focus:ring-1 focus:ring-amber-500 outline-none"
                              />
                              <span className="text-[10px] text-amber-800 font-bold">
                                {item.unidadeMedida === "KG" ? "kg" : "un"}
                              </span>
                            </div>
                          </td>

                          {/* Custo Calculado Automático */}
                          <td className="p-2 text-right font-black text-amber-950 text-xs">
                            {formatarCentavosParaReal(calc?.custoItemCentavos || 0)}
                          </td>

                          {/* Botão Remover */}
                          <td className="p-2 text-center">
                            {itens.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removerLinha(idx)}
                                className="p-1 text-stone-400 hover:text-rose-600 transition"
                                title="Remover este insumo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botão para Adicionar Insumo */}
              <button
                type="button"
                onClick={adicionarLinha}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 px-3 py-2 rounded-xl transition border border-amber-200/80"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Insumo / Ingrediente
              </button>

              {/* Box de Totais & Volume Consolidado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                {/* Volume Total */}
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Volume / Peso Total da Receita
                  </span>
                  <div className="text-base sm:text-lg font-black text-stone-900 mt-1 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-amber-600" />
                    {todosMesmaUnidade ? (
                      <span>
                        {somaVolumeTotal.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}{" "}
                        {unidadePrincipal === "KG" ? "kg" : "unidades"}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-stone-700">
                        {somaKg > 0 ? `${somaKg.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg` : ""}
                        {somaKg > 0 && somaUn > 0 ? " + " : ""}
                        {somaUn > 0 ? `${somaUn} un` : ""}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-500">
                    {itensCalculados.filter((i) => i.nomeInsumo.trim()).length} insumos citados
                  </span>
                </div>

                {/* Custo Total da Receita */}
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Custo Total da Receita
                  </span>
                  <div className="text-base sm:text-lg font-black text-stone-900 mt-1">
                    {formatarCentavosParaReal(custoTotalReceitaCentavos)}
                  </div>
                  <span className="text-[11px] text-stone-500">
                    Produz {produto.rendimento} {produto.rendimento > 1 ? "bolos/unidades" : "bolo"}
                  </span>
                </div>

                {/* Custo Unitário Final do Produto */}
                <div className="bg-amber-100/70 p-3 rounded-lg border border-amber-300">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                    Custo Unitário do Produto
                  </span>
                  <div className="text-lg sm:text-xl font-black text-amber-950 mt-1">
                    {formatarCentavosParaReal(custoUnitarioCentavos)}
                  </div>
                  <span className="text-[11px] text-amber-800 font-semibold">
                    Custo base por unidade produzida
                  </span>
                </div>
              </div>

              {/* Comparativo com Preço de Venda Praticado */}
              <div className="bg-white p-3.5 rounded-xl border border-stone-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-stone-800 block">Preços de Venda Atual do Produto:</span>
                  <div className="flex items-center gap-3 text-stone-600">
                    <span>
                      Padrão: <strong>{formatarCentavosParaReal(produto.precoVenda)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Diferenciado: <strong>{formatarCentavosParaReal(produto.precoSecundario || produto.precoVenda)}</strong>
                    </span>
                  </div>
                </div>

                {custoUnitarioCentavos > 0 && produto.precoVenda > 0 && (
                  <div className="text-right sm:text-right">
                    <span className="text-[10px] text-stone-500 block">Margem Bruta (Preço Padrão):</span>
                    <span className="font-black text-sm text-emerald-700">
                      {formatarCentavosParaReal(produto.precoVenda - custoUnitarioCentavos)}{" "}
                      <span className="text-xs font-bold text-stone-600">
                        ({Math.round(((produto.precoVenda - custoUnitarioCentavos) / produto.precoVenda) * 100)}%)
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Observações da Ficha */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Observações / Modo de Preparo (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Tempo de forno 45min a 180°C..."
                  className="w-full px-3 py-2 border rounded-xl text-xs text-stone-900 focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Botões do Rodapé */}
              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="py-2.5 px-4 border rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
                >
                  {isPending ? "Salvando Ficha..." : "Salvar Ficha Técnica & Atualizar Custo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
