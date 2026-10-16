"use client";

import { useState, useTransition } from "react";
import { formatarCentavosParaReal } from "@/lib/formatadores";
import {
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { criarIngredienteAction } from "@/app/actions/ingredientes";
import { salvarFichaTecnicaAction } from "@/app/actions/fichaTecnica";
import ModalEditarIngrediente from "./ModalEditarIngrediente";

interface PrecoHistorico {
  id: string;
  dataRegistro: Date | string;
  unidadeCompra: string;
  tamanhoEmbalagem: number;
  precoEmbalagem: number;
  custoUnidadeBase: number;
}

interface IngredienteItem {
  id: string;
  nome: string;
  unidadeBase: string;
  ativo: boolean;
  historicoPrecos: PrecoHistorico[];
}

interface ItemFichaData {
  id?: string;
  nomeInsumo: string;
  unidadeMedida: "KG" | "UNIDADE" | string;
  precoEmbalagem: number;
  tamanhoEmbalagem: number;
  quantidade: number;
  custoCalculado: number;
}

interface ProdutoComFicha {
  id: string;
  nome: string;
  rendimento: number;
  precoVenda: number;
  precoSecundario: number;
  ativo: boolean;
  fichaTecnica: {
    id: string;
    observacoes: string | null;
    itens: ItemFichaData[];
  } | null;
}

interface ItemFichaRow {
  ingredienteId: string;
  nomeInsumo: string;
  unidadeMedida: "KG" | "UNIDADE";
  precoEmbalagemStr: string;
  tamanhoEmbalagemStr: string;
  quantidadeStr: string;
}

export default function GestaoIngredientesEFichas({
  ingredientes,
  produtos,
}: {
  ingredientes: IngredienteItem[];
  produtos: ProdutoComFicha[];
}) {
  const [abaAtiva, setAbaAtiva] = useState<"ingredientes" | "fichas">("ingredientes");

  // Estados da aba de ingredientes
  const [buscaIngrediente, setBuscaIngrediente] = useState("");
  const [isPendingIngrediente, startTransitionIngrediente] = useTransition();
  const [msgIngrediente, setMsgIngrediente] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // Estados da aba de fichas
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<string>(
    produtos.length > 0 ? produtos[0].id : ""
  );

  const produtoSelecionado = produtos.find((p) => p.id === produtoSelecionadoId) || produtos[0];

  const carregarLinhasDoProduto = (prod: ProdutoComFicha | undefined): ItemFichaRow[] => {
    if (!prod?.fichaTecnica?.itens?.length) {
      return [];
    }
    return prod.fichaTecnica.itens.map((item) => {
      const ingCorrespondente = ingredientes.find(
        (i) => i.nome.trim().toLowerCase() === item.nomeInsumo.trim().toLowerCase()
      );
      return {
        ingredienteId: ingCorrespondente?.id || "custom",
        nomeInsumo: item.nomeInsumo,
        unidadeMedida: (item.unidadeMedida === "UNIDADE" ? "UNIDADE" : "KG") as "KG" | "UNIDADE",
        precoEmbalagemStr: (item.precoEmbalagem / 100).toFixed(2),
        tamanhoEmbalagemStr: item.tamanhoEmbalagem.toString(),
        quantidadeStr: item.quantidade.toString(),
      };
    });
  };

  const [itensFicha, setItensFicha] = useState<ItemFichaRow[]>(() => carregarLinhasDoProduto(produtoSelecionado));
  const [obsFicha, setObsFicha] = useState(produtoSelecionado?.fichaTecnica?.observacoes || "");
  const [isPendingFicha, startTransitionFicha] = useTransition();
  const [msgFicha, setMsgFicha] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const selecionarProdutoParaEditar = (prod: ProdutoComFicha) => {
    setProdutoSelecionadoId(prod.id);
    setMsgFicha(null);
    setObsFicha(prod.fichaTecnica?.observacoes || "");
    setItensFicha(carregarLinhasDoProduto(prod));
  };

  const adicionarInsumoCadastrado = (ingredienteId: string) => {
    if (!ingredienteId) return;
    const ing = ingredientes.find((i) => i.id === ingredienteId);
    if (!ing) return;

    const ultimoPreco = ing.historicoPrecos[0];
    const unidadeMedida: "KG" | "UNIDADE" = ing.unidadeBase === "UNIDADE" ? "UNIDADE" : "KG";
    const precoStr = ultimoPreco ? (ultimoPreco.precoEmbalagem / 100).toFixed(2) : "0.00";
    const tamStr = ultimoPreco ? ultimoPreco.tamanhoEmbalagem.toString() : "1";

    setItensFicha((prev) => [
      ...prev,
      {
        ingredienteId: ing.id,
        nomeInsumo: ing.nome,
        unidadeMedida,
        precoEmbalagemStr: precoStr,
        tamanhoEmbalagemStr: tamStr,
        quantidadeStr: "",
      },
    ]);
  };

  const trocarInsumoDaLinha = (index: number, novoIngredienteId: string) => {
    const ing = ingredientes.find((i) => i.id === novoIngredienteId);
    if (!ing) return;

    const ultimoPreco = ing.historicoPrecos[0];
    const unidadeMedida: "KG" | "UNIDADE" = ing.unidadeBase === "UNIDADE" ? "UNIDADE" : "KG";
    const precoStr = ultimoPreco ? (ultimoPreco.precoEmbalagem / 100).toFixed(2) : "0.00";
    const tamStr = ultimoPreco ? ultimoPreco.tamanhoEmbalagem.toString() : "1";

    setItensFicha((prev) => {
      const novos = [...prev];
      novos[index] = {
        ...novos[index],
        ingredienteId: ing.id,
        nomeInsumo: ing.nome,
        unidadeMedida,
        precoEmbalagemStr: precoStr,
        tamanhoEmbalagemStr: tamStr,
      };
      return novos;
    });
  };

  const removerLinhaInsumo = (index: number) => {
    setItensFicha((prev) => prev.filter((_, i) => i !== index));
  };

  const atualizarQuantidadeInsumo = (index: number, novaQtd: string) => {
    setItensFicha((prev) => {
      const novos = [...prev];
      novos[index] = { ...novos[index], quantidadeStr: novaQtd };
      return novos;
    });
  };

  // Cálculos
  const calculosFicha = itensFicha.map((item) => {
    const precoCentavos = Math.round(parseFloat(item.precoEmbalagemStr.replace(",", ".")) * 100) || 0;
    const tamanho = parseFloat(item.tamanhoEmbalagemStr.replace(",", ".")) || 1;
    const quantidade = parseFloat(item.quantidadeStr.replace(",", ".")) || 0;

    const proporcao = tamanho > 0 ? quantidade / tamanho : 0;
    const custoCalculado = Math.round(precoCentavos * proporcao);

    return {
      precoCentavos,
      tamanho,
      quantidade,
      custoCalculado,
      unidadeMedida: item.unidadeMedida,
    };
  });

  const custoTotalReceita = calculosFicha.reduce((acc, c) => acc + c.custoCalculado, 0);
  const rendimento = produtoSelecionado?.rendimento || 1;
  const custoUnitario = rendimento > 0 ? Math.round(custoTotalReceita / rendimento) : custoTotalReceita;

  const totalKg = calculosFicha
    .filter((c) => c.unidadeMedida === "KG")
    .reduce((acc, c) => acc + c.quantidade, 0);

  const totalUn = calculosFicha
    .filter((c) => c.unidadeMedida === "UNIDADE")
    .reduce((acc, c) => acc + c.quantidade, 0);

  const handleSalvarFicha = () => {
    if (!produtoSelecionado) return;
    setMsgFicha(null);

    const itensValidos = itensFicha
      .filter((i) => i.nomeInsumo.trim().length > 0)
      .map((i) => {
        const precoCentavos = Math.round(parseFloat(i.precoEmbalagemStr.replace(",", ".")) * 100) || 0;
        const tam = parseFloat(i.tamanhoEmbalagemStr.replace(",", ".")) || 1;
        const qtd = parseFloat(i.quantidadeStr.replace(",", ".")) || 0;
        return {
          nomeInsumo: i.nomeInsumo.trim(),
          unidadeMedida: i.unidadeMedida,
          precoEmbalagem: precoCentavos,
          tamanhoEmbalagem: tam,
          quantidade: qtd,
        };
      });

    startTransitionFicha(async () => {
      const res = await salvarFichaTecnicaAction(produtoSelecionado.id, itensValidos, obsFicha);
      if (res.sucesso) {
        setMsgFicha({ tipo: "sucesso", texto: "Ficha salva com sucesso." });
      } else {
        setMsgFicha({ tipo: "erro", texto: res.erro || "Erro ao salvar." });
      }
    });
  };

  const ingredientesFiltrados = ingredientes.filter((i) =>
    i.nome.toLowerCase().includes(buscaIngrediente.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Topo Limpo e Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            Ingredientes e Fichas
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Cadastre os insumos e vincule o consumo de cada produto.
          </p>
        </div>

        {/* Abas Minimalistas */}
        <div className="inline-flex border-b border-stone-200 gap-6 text-sm">
          <button
            onClick={() => setAbaAtiva("ingredientes")}
            className={`pb-2 font-medium transition-colors ${
              abaAtiva === "ingredientes"
                ? "border-b-2 border-stone-900 text-stone-900 font-semibold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            1. Insumos ({ingredientes.length})
          </button>

          <button
            onClick={() => setAbaAtiva("fichas")}
            className={`pb-2 font-medium transition-colors ${
              abaAtiva === "fichas"
                ? "border-b-2 border-stone-900 text-stone-900 font-semibold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            2. Ficha Técnica dos Produtos
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: INSUMOS (MINIMALISTA)                                  */}
      {/* ============================================================== */}
      {abaAtiva === "ingredientes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Formulário Minimalista de Cadastro */}
          <div className="bg-white p-5 rounded-xl border border-stone-200">
            <h2 className="text-sm font-semibold text-stone-900 mb-3">
              Novo Insumo
            </h2>

            {msgIngrediente && (
              <div
                className={`p-2.5 rounded-lg mb-3 text-xs font-medium ${
                  msgIngrediente.tipo === "sucesso"
                    ? "bg-stone-100 text-stone-800"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {msgIngrediente.texto}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                startTransitionIngrediente(async () => {
                  const res = await criarIngredienteAction(formData);
                  if (res?.sucesso) {
                    setMsgIngrediente({ tipo: "sucesso", texto: "Insumo salvo com sucesso." });
                    (e.target as HTMLFormElement).reset();
                  } else {
                    setMsgIngrediente({ tipo: "erro", texto: res?.erro || "Erro ao salvar." });
                  }
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  name="nome"
                  required
                  placeholder="Ex: Farinha de Trigo"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-stone-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Unidade
                  </label>
                  <select
                    name="unidadeMedida"
                    defaultValue="KG"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 bg-white focus:border-stone-400 outline-none"
                  >
                    <option value="KG">Quilo (kg)</option>
                    <option value="UNIDADE">Unidade (un)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    name="quantidade"
                    defaultValue="1"
                    required
                    placeholder="1"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-stone-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Custo Total (R$)
                </label>
                <input
                  type="text"
                  name="preco"
                  required
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-stone-400 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPendingIngrediente}
                className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition"
              >
                {isPendingIngrediente ? "Salvando..." : "Salvar Insumo"}
              </button>
            </form>
          </div>

          {/* Lista Minimalista de Insumos */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-stone-500">
                {ingredientesFiltrados.length} insumo(s) cadastrado(s)
              </span>

              <input
                type="text"
                placeholder="Buscar insumo..."
                value={buscaIngrediente}
                onChange={(e) => setBuscaIngrediente(e.target.value)}
                className="w-56 px-3 py-1.5 border border-stone-200 rounded-lg text-xs text-stone-900 focus:border-stone-400 outline-none"
              />
            </div>

            {ingredientesFiltrados.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                Nenhum insumo encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-400 font-medium">
                      <th className="py-2.5 px-4 font-normal">Insumo</th>
                      <th className="py-2.5 px-3 text-center font-normal">Unidade</th>
                      <th className="py-2.5 px-4 text-right font-normal">Qtd. Cadastrada</th>
                      <th className="py-2.5 px-4 text-right font-normal">Custo Total</th>
                      <th className="py-2.5 px-4 text-right font-normal">Custo Unitário</th>
                      <th className="py-2.5 px-3 text-right font-normal"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {ingredientesFiltrados.map((i) => {
                      const preco = i.historicoPrecos[0];
                      const unidadeStr = i.unidadeBase === "UNIDADE" ? "un" : "kg";
                      const custoUnitarioCalculado = preco
                        ? (preco.precoEmbalagem / (preco.tamanhoEmbalagem || 1)) / 100
                        : 0;

                      return (
                        <tr key={i.id} className="hover:bg-stone-50/50">
                          <td className="py-2.5 px-4 font-medium text-stone-900">
                            {i.nome}
                          </td>

                          <td className="py-2.5 px-3 text-center text-stone-500">
                            {unidadeStr}
                          </td>

                          <td className="py-2.5 px-4 text-right text-stone-600">
                            {preco ? `${preco.tamanhoEmbalagem} ${unidadeStr}` : "-"}
                          </td>

                          <td className="py-2.5 px-4 text-right font-medium text-stone-900">
                            {preco ? formatarCentavosParaReal(preco.precoEmbalagem) : "-"}
                          </td>

                          <td className="py-2.5 px-4 text-right text-stone-600">
                            {preco ? `R$ ${custoUnitarioCalculado.toFixed(2)} / ${unidadeStr}` : "-"}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <ModalEditarIngrediente ingrediente={i} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: FICHA TÉCNICA (MINIMALISTA, SÓBRIA E CLARA)            */}
      {/* ============================================================== */}
      {abaAtiva === "fichas" && (
        <div className="space-y-4">
          {/* Barra Simples de Seleção de Produto */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-stone-500">Produto:</span>
              <div className="relative">
                <select
                  value={produtoSelecionado?.id || ""}
                  onChange={(e) => {
                    const prod = produtos.find((p) => p.id === e.target.value);
                    if (prod) selecionarProdutoParaEditar(prod);
                  }}
                  className="appearance-none bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-lg px-3 py-1.5 text-stone-900 font-semibold text-sm outline-none transition cursor-pointer pr-8"
                >
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {produtoSelecionado && (
                <span className="text-xs text-stone-500">
                  Rendimento: <strong>{produtoSelecionado.rendimento} un</strong>
                </span>
              )}
            </div>

            {/* Adicionar Insumo */}
            {ingredientes.length > 0 && (
              <div className="relative">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      adicionarInsumoCadastrado(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="bg-stone-900 hover:bg-stone-800 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition cursor-pointer outline-none"
                >
                  <option value="" disabled className="text-stone-900 bg-white">
                    + Inserir insumo na receita...
                  </option>
                  {ingredientes.map((ing) => (
                    <option key={ing.id} value={ing.id} className="text-stone-900 bg-white">
                      {ing.nome} ({ing.unidadeBase === "UNIDADE" ? "un" : "kg"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Feedback */}
          {msgFicha && (
            <div
              className={`p-3 rounded-lg text-xs font-medium ${
                msgFicha.tipo === "sucesso"
                  ? "bg-stone-100 text-stone-800"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {msgFicha.texto}
            </div>
          )}

          {/* Tabela de Insumos da Receita */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            {itensFicha.length === 0 ? (
              <div className="p-10 text-center text-xs text-stone-400">
                Nenhum insumo adicionado a esta receita. Clique em "+ Inserir insumo" acima.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-400 font-normal">
                      <th className="py-2.5 px-4 font-normal">Insumo</th>
                      <th className="py-2.5 px-3 text-center font-normal w-24">Unidade</th>
                      <th className="py-2.5 px-4 text-right font-normal w-32">Custo Base</th>
                      <th className="py-2.5 px-4 text-right font-normal w-40">Qtd. na Receita</th>
                      <th className="py-2.5 px-4 text-right font-normal w-32">Custo</th>
                      <th className="py-2.5 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {itensFicha.map((item, idx) => {
                      const calc = calculosFicha[idx];

                      return (
                        <tr key={idx} className="hover:bg-stone-50/50">
                          {/* Insumo */}
                          <td className="py-2 px-4">
                            <select
                              value={item.ingredienteId}
                              onChange={(e) => trocarInsumoDaLinha(idx, e.target.value)}
                              className="font-medium text-stone-900 bg-transparent outline-none cursor-pointer text-xs"
                            >
                              {item.ingredienteId === "custom" && (
                                <option value="custom">{item.nomeInsumo}</option>
                              )}
                              {ingredientes.map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.nome}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Unidade */}
                          <td className="py-2 px-3 text-center text-stone-500">
                            {item.unidadeMedida === "UNIDADE" ? "un" : "kg"}
                          </td>

                          {/* Custo Base */}
                          <td className="py-2 px-4 text-right text-stone-500">
                            {formatarCentavosParaReal(calc?.precoCentavos || 0)}
                          </td>

                          {/* Quantidade na Receita */}
                          <td className="py-2 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <input
                                type="text"
                                value={item.quantidadeStr}
                                onChange={(e) => atualizarQuantidadeInsumo(idx, e.target.value)}
                                placeholder="0"
                                className="w-20 px-2 py-1 border border-stone-200 rounded text-xs text-right text-stone-900 outline-none focus:border-stone-400"
                              />
                              <span className="text-stone-400 text-[11px]">
                                {item.unidadeMedida === "UNIDADE" ? "un" : "kg"}
                              </span>
                            </div>
                          </td>

                          {/* Custo Proporcional */}
                          <td className="py-2 px-4 text-right font-medium text-stone-900">
                            {formatarCentavosParaReal(calc?.custoCalculado || 0)}
                          </td>

                          {/* Remover */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removerLinhaInsumo(idx)}
                              className="p-1 text-stone-400 hover:text-stone-700 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Linha de Resumo e Custo */}
            <div className="p-4 bg-stone-50/70 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-6 text-stone-600">
                <div>
                  Peso/Qtd Total:{" "}
                  <strong className="text-stone-900">
                    {totalKg > 0 && `${totalKg.toFixed(3)} kg`}
                    {totalKg > 0 && totalUn > 0 && " + "}
                    {totalUn > 0 && `${totalUn} un`}
                    {totalKg === 0 && totalUn === 0 && "-"}
                  </strong>
                </div>

                <div>
                  Custo da Receita:{" "}
                  <strong className="text-stone-900 font-semibold">
                    {formatarCentavosParaReal(custoTotalReceita)}
                  </strong>
                </div>

                <div>
                  Custo Unitário:{" "}
                  <strong className="text-stone-950 font-bold text-sm">
                    {formatarCentavosParaReal(custoUnitario)}
                  </strong>{" "}
                  <span className="text-stone-400">/ un</span>
                </div>

                {produtoSelecionado && (
                  <div>
                    Margem Venda ({formatarCentavosParaReal(produtoSelecionado.precoVenda)}):{" "}
                    <strong className="text-stone-900">
                      {produtoSelecionado.precoVenda > custoUnitario
                        ? `${(
                            ((produtoSelecionado.precoVenda - custoUnitario) /
                              produtoSelecionado.precoVenda) *
                            100
                          ).toFixed(0)}%`
                        : "0%"}
                    </strong>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSalvarFicha}
                disabled={isPendingFicha}
                className="bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-xs transition"
              >
                {isPendingFicha ? "Salvando..." : "Salvar Ficha"}
              </button>
            </div>
          </div>

          {/* Observações da Receita */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Observações
            </label>
            <input
              type="text"
              value={obsFicha}
              onChange={(e) => setObsFicha(e.target.value)}
              placeholder="Anotações sobre forno, tempo ou preparo (opcional)..."
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs text-stone-800 focus:border-stone-400 outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
