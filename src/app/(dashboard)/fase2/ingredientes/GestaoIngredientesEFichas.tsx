"use client";

import { useState, useTransition } from "react";
import { formatarCentavosParaReal } from "@/lib/formatadores";
import {
  Wheat,
  FileSpreadsheet,
  Plus,
  Sliders,
  Scale,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Cake,
  Trash2,
  Save,
  Check,
  ChevronDown,
  Info,
  DollarSign,
  TrendingUp,
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

  // Helper para inicializar linhas da ficha técnica a partir dos itens salvos
  const carregarLinhasDoProduto = (prod: ProdutoComFicha | undefined): ItemFichaRow[] => {
    if (!prod?.fichaTecnica?.itens?.length) {
      return [];
    }
    return prod.fichaTecnica.itens.map((item) => {
      // Tentar associar com ingrediente cadastrado pelo nome
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

  // Troca de produto selecionado
  const selecionarProdutoParaEditar = (prod: ProdutoComFicha) => {
    setProdutoSelecionadoId(prod.id);
    setMsgFicha(null);
    setObsFicha(prod.fichaTecnica?.observacoes || "");
    setItensFicha(carregarLinhasDoProduto(prod));
  };

  // Adicionar um insumo já cadastrado na receita
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

  // Trocar o insumo de uma linha existente
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

  // Cálculos em tempo real da ficha técnica
  const calculosFicha = itensFicha.map((item) => {
    const precoCentavos = Math.round(parseFloat(item.precoEmbalagemStr.replace(",", ".")) * 100) || 0;
    const tamanho = parseFloat(item.tamanhoEmbalagemStr.replace(",", ".")) || 1;
    const quantidade = parseFloat(item.quantidadeStr.replace(",", ".")) || 0;

    const proporcao = tamanho > 0 ? quantidade / tamanho : 0;
    const custoCalculado = Math.round(precoCentavos * proporcao);

    const custoUnitarioInsumo = tamanho > 0 ? precoCentavos / tamanho : precoCentavos;

    return {
      precoCentavos,
      tamanho,
      quantidade,
      custoCalculado,
      custoUnitarioInsumo,
      unidadeMedida: item.unidadeMedida,
    };
  });

  const custoTotalReceita = calculosFicha.reduce((acc, c) => acc + c.custoCalculado, 0);
  const rendimento = produtoSelecionado?.rendimento || 1;
  const custoUnitario = rendimento > 0 ? Math.round(custoTotalReceita / rendimento) : custoTotalReceita;

  // Soma de volume / quantidade
  const totalKg = calculosFicha
    .filter((c) => c.unidadeMedida === "KG")
    .reduce((acc, c) => acc + c.quantidade, 0);

  const totalUn = calculosFicha
    .filter((c) => c.unidadeMedida === "UNIDADE")
    .reduce((acc, c) => acc + c.quantidade, 0);

  const todosSaoKg = calculosFicha.every((c) => c.unidadeMedida === "KG" || c.quantidade === 0);
  const todosSaoUn = calculosFicha.every((c) => c.unidadeMedida === "UNIDADE" || c.quantidade === 0);

  // Salvar Ficha Técnica
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
        setMsgFicha({ tipo: "sucesso", texto: "Ficha técnica salva com sucesso!" });
      } else {
        setMsgFicha({ tipo: "erro", texto: res.erro || "Erro ao salvar ficha técnica." });
      }
    });
  };

  const ingredientesFiltrados = ingredientes.filter((i) =>
    i.nome.toLowerCase().includes(buscaIngrediente.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Cabeçalho Superior com Navegação em Abas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-8 h-8 text-amber-600" />
            Ingredientes & Fichas Técnicas
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Gerencie os insumos cadastrados e componha as receitas selecionando os itens para cálculo automático de custo.
          </p>
        </div>

        {/* Abas Alternadoras */}
        <div className="inline-flex p-1.5 bg-stone-200/90 rounded-2xl border border-stone-300 shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setAbaAtiva("ingredientes")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              abaAtiva === "ingredientes"
                ? "bg-white text-stone-950 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Wheat className="w-4 h-4 text-amber-600" />
            1. Cadastro de Insumos
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
              {ingredientes.length}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva("fichas")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              abaAtiva === "fichas"
                ? "bg-white text-amber-950 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-700" />
            2. Fichas Técnicas dos Produtos
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">
              {produtos.filter((p) => p.fichaTecnica && p.fichaTecnica.itens.length > 0).length}/{produtos.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: FICHAS TÉCNICAS (DESIGN ESPAÇOSO, INTUITIVO E DIRETO)    */}
      {/* ============================================================== */}
      {abaAtiva === "fichas" && (
        <div className="space-y-6">
          {/* Barra de Seleção de Produto Ampla */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/70 inline-block">
                  Produto para Montagem da Receita
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                  Selecione o produto que você deseja gerenciar a ficha:
                </h2>
              </div>

              {/* Seletor Dropdown Amplo */}
              <div className="w-full lg:w-96">
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
                  Escolher Produto
                </label>
                <div className="relative">
                  <select
                    value={produtoSelecionado?.id || ""}
                    onChange={(e) => {
                      const prod = produtos.find((p) => p.id === e.target.value);
                      if (prod) selecionarProdutoParaEditar(prod);
                    }}
                    className="w-full appearance-none bg-stone-50 hover:bg-stone-100 border-2 border-amber-500/30 focus:border-amber-500 rounded-xl px-4 py-3 text-stone-900 font-black text-base outline-none transition cursor-pointer pr-10"
                  >
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.rendimento} un) {p.fichaTecnica?.itens.length ? "✓ Ficha Pronta" : "— Sem Ficha"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-stone-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Badges de Informações do Produto Selecionado */}
            {produtoSelecionado && (
              <div className="mt-6 pt-5 border-t border-stone-100 flex flex-wrap items-center gap-6 text-sm text-stone-600">
                <div className="flex items-center gap-2">
                  <Cake className="w-4 h-4 text-amber-600" />
                  <span>
                    Produto: <strong className="text-stone-900 text-base">{produtoSelecionado.nome}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-stone-400" />
                  <span>
                    Rendimento da Receita:{" "}
                    <strong className="text-stone-900 font-bold">{produtoSelecionado.rendimento} unidades</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>
                    Preço de Venda Padrão:{" "}
                    <strong className="text-stone-900 font-black">
                      {formatarCentavosParaReal(produtoSelecionado.precoVenda)}
                    </strong>
                  </span>
                </div>

                {produtoSelecionado.precoSecundario > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">•</span>
                    <span>
                      Preço Diferenciado:{" "}
                      <strong className="text-stone-800 font-bold">
                        {formatarCentavosParaReal(produtoSelecionado.precoSecundario)}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Área Principal da Ficha Técnica */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
            {/* Cabeçalho da Área com Ação de Inserir Insumo Cadastrado */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-600" />
                  Insumos da Receita
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  Adicione os insumos cadastrados à receita e informe a quantidade gasta no preparo.
                </p>
              </div>

              {/* Botão de Adicionar Insumo Cadastrado */}
              <div className="flex items-center gap-3">
                {ingredientes.length === 0 ? (
                  <div className="text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Nenhum insumo cadastrado ainda. Cadastre insumos na outra aba.</span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          adicionarInsumoCadastrado(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-sm transition shadow-sm cursor-pointer outline-none flex items-center gap-2"
                    >
                      <option value="" disabled className="text-stone-900 bg-white">
                        + Puxar Insumo Cadastrado...
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
            </div>

            {/* Mensagem de Feedback ao Salvar */}
            {msgFicha && (
              <div
                className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 ${
                  msgFicha.tipo === "sucesso"
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "bg-red-50 text-red-900 border border-red-200"
                }`}
              >
                {msgFicha.tipo === "sucesso" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                {msgFicha.texto}
              </div>
            )}

            {/* Tabela Ampla e Confortável de Itens da Receita */}
            {itensFicha.length === 0 ? (
              <div className="p-16 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                <Scale className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h4 className="font-bold text-stone-800 text-base">Nenhum insumo adicionado a esta receita</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  Clique no botão <strong>"+ Puxar Insumo Cadastrado"</strong> acima para escolher os insumos que compõem este produto.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-stone-200 rounded-2xl shadow-2xs">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50/80 text-stone-600 font-bold uppercase text-xs tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-4 px-5">Insumo Cadastrado</th>
                      <th className="py-4 px-4 text-center w-32">Unidade</th>
                      <th className="py-4 px-4 text-right w-44">Custo do Insumo</th>
                      <th className="py-4 px-5 text-right w-52">Qtd. Usada na Receita</th>
                      <th className="py-4 px-5 text-right w-48 font-black text-amber-950">
                        Custo Proporcional
                      </th>
                      <th className="py-4 px-3 w-16 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {itensFicha.map((item, idx) => {
                      const calc = calculosFicha[idx];

                      return (
                        <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                          {/* Insumo selecionado com dropdown caso queira alterar */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2">
                              <select
                                value={item.ingredienteId}
                                onChange={(e) => trocarInsumoDaLinha(idx, e.target.value)}
                                className="font-extrabold text-stone-900 bg-transparent border-b border-dashed border-stone-300 hover:border-amber-500 pb-0.5 outline-none text-base cursor-pointer"
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
                            </div>
                          </td>

                          {/* Unidade: KG ou UNIDADE */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex px-3 py-1 rounded-lg bg-stone-100 text-stone-700 font-bold text-xs uppercase tracking-wider">
                              {item.unidadeMedida === "UNIDADE" ? "Unidade" : "Quilo (kg)"}
                            </span>
                          </td>

                          {/* Custo Total e Referência por kg/un */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-bold text-stone-800">
                              {formatarCentavosParaReal(calc?.precoCentavos || 0)}
                            </div>
                            <span className="text-[11px] text-stone-400 block">
                              por {item.tamanhoEmbalagemStr} {item.unidadeMedida === "UNIDADE" ? "un" : "kg"}
                            </span>
                          </td>

                          {/* Quantidade na Receita */}
                          <td className="py-3.5 px-5 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              <input
                                type="text"
                                value={item.quantidadeStr}
                                onChange={(e) => atualizarQuantidadeInsumo(idx, e.target.value)}
                                placeholder={item.unidadeMedida === "KG" ? "0,5" : "2"}
                                className="w-28 px-3 py-2 border-2 border-stone-300 focus:border-amber-500 rounded-xl text-sm font-black text-right text-stone-900 outline-none transition"
                              />
                              <span className="text-xs font-bold text-stone-500">
                                {item.unidadeMedida === "UNIDADE" ? "un" : "kg"}
                              </span>
                            </div>
                          </td>

                          {/* Custo Calculado Proporcional */}
                          <td className="py-3.5 px-5 text-right font-black text-amber-950 text-base">
                            {formatarCentavosParaReal(calc?.custoCalculado || 0)}
                          </td>

                          {/* Remover */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removerLinhaInsumo(idx)}
                              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Remover insumo da receita"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totalizadores Amplos e de Alto Impacto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Volume / Peso Total */}
              <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Volume / Peso Total da Receita
                </span>
                <div className="font-black text-stone-900 text-2xl">
                  {todosSaoKg && `${totalKg.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg`}
                  {todosSaoUn && `${totalUn} un`}
                  {!todosSaoKg && !todosSaoUn && (
                    <div className="text-xl font-black text-stone-800">
                      {totalKg > 0 && <span>{totalKg.toFixed(3)} kg</span>}
                      {totalKg > 0 && totalUn > 0 && <span> + </span>}
                      {totalUn > 0 && <span>{totalUn} un</span>}
                    </div>
                  )}
                </div>
                <span className="text-xs text-stone-400 mt-1 block">
                  Soma total dos insumos utilizados no lote
                </span>
              </div>

              {/* Custo Total da Receita */}
              <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Custo Total da Receita
                </span>
                <div className="font-black text-amber-950 text-2xl">
                  {formatarCentavosParaReal(custoTotalReceita)}
                </div>
                <span className="text-xs text-stone-400 mt-1 block">
                  Soma dos custos de todos os insumos
                </span>
              </div>

              {/* Custo Unitário do Produto (Destaque Principal) */}
              <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-5 rounded-2xl shadow-md">
                <span className="text-xs font-bold text-amber-100 uppercase tracking-wider block mb-1">
                  Custo Unitário do Produto
                </span>
                <div className="font-black text-3xl">
                  {formatarCentavosParaReal(custoUnitario)}
                </div>
                <span className="text-xs text-amber-200 mt-1 block font-medium">
                  Custo da receita ÷ {produtoSelecionado?.rendimento || 1} unidades de rendimento
                </span>
              </div>
            </div>

            {/* Painel de Margem e Lucratividade com Preço Padrão */}
            {produtoSelecionado && (
              <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Análise de Margem de Lucro (Preço de Venda:{" "}
                    {formatarCentavosParaReal(produtoSelecionado.precoVenda)})
                  </span>
                  <p className="text-xs sm:text-sm text-stone-600">
                    {produtoSelecionado.precoVenda > custoUnitario ? (
                      <>
                        Lucro bruto de{" "}
                        <strong className="text-emerald-700 font-black">
                          {formatarCentavosParaReal(produtoSelecionado.precoVenda - custoUnitario)}
                        </strong>{" "}
                        por unidade (
                        <strong>
                          {(
                            ((produtoSelecionado.precoVenda - custoUnitario) /
                              produtoSelecionado.precoVenda) *
                            100
                          ).toFixed(1)}
                          % de margem
                        </strong>
                        ).
                      </>
                    ) : (
                      <span className="text-red-600 font-bold">
                        Atenção: O preço de venda está abaixo do custo unitário do produto!
                      </span>
                    )}
                  </p>
                </div>

                {/* Botão de Salvar Ficha Técnica */}
                <button
                  type="button"
                  onClick={handleSalvarFicha}
                  disabled={isPendingFicha}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black px-8 py-3.5 rounded-xl text-base transition shadow-md flex items-center justify-center gap-2.5 self-stretch md:self-auto"
                >
                  <Save className="w-5 h-5" />
                  {isPendingFicha ? "Salvando Ficha..." : "Salvar Ficha Técnica"}
                </button>
              </div>
            )}

            {/* Observações / Modo de Preparo */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-stone-700 uppercase mb-2">
                Observações / Modo de Preparo da Receita
              </label>
              <textarea
                rows={3}
                value={obsFicha}
                onChange={(e) => setObsFicha(e.target.value)}
                placeholder="Anote detalhes de preparo, tempo de forno ou orientações sobre os insumos..."
                className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none placeholder:text-stone-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: CADASTRO DE INSUMOS                                     */}
      {/* ============================================================== */}
      {abaAtiva === "ingredientes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário Novo Insumo */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-stone-900 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-600" />
              Cadastrar Insumo / Ingrediente
            </h2>
            <p className="text-xs text-stone-500 mb-5">
              Cadastre o insumo com sua quantidade e custo para compor as receitas.
            </p>

            {msgIngrediente && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                  msgIngrediente.tipo === "sucesso"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {msgIngrediente.tipo === "sucesso" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
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
                    setMsgIngrediente({ tipo: "sucesso", texto: "Insumo cadastrado com sucesso!" });
                    (e.target as HTMLFormElement).reset();
                  } else {
                    setMsgIngrediente({ tipo: "erro", texto: res?.erro || "Erro ao salvar insumo." });
                  }
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Nome do Insumo
                </label>
                <input
                  type="text"
                  name="nome"
                  required
                  placeholder="Ex: Farinha de Trigo, Ovos, Leite"
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none placeholder:text-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    name="unidadeMedida"
                    defaultValue="KG"
                    className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 font-bold bg-white"
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
                    name="quantidade"
                    defaultValue="1"
                    required
                    placeholder="Ex: 1 ou 30"
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 font-medium"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Ex: 1 kg ou 30 un</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Custo (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold text-sm">R$</span>
                  <input
                    type="text"
                    name="preco"
                    required
                    placeholder="0,00"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 font-black"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Valor pago pelo insumo (ex: R$ 5,50 por 1kg de farinha).
                </p>
              </div>

              <button
                type="submit"
                disabled={isPendingIngrediente}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isPendingIngrediente ? "Salvando..." : "Salvar Insumo"}
              </button>
            </form>
          </div>

          {/* Tabela de Insumos */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Wheat className="w-5 h-5 text-amber-600" />
                  Insumos Cadastrados ({ingredientesFiltrados.length})
                </h2>
                <p className="text-xs text-stone-500">
                  Lista de insumos disponíveis para compor receitas e fichas.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar insumo..."
                  value={buscaIngrediente}
                  onChange={(e) => setBuscaIngrediente(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {ingredientesFiltrados.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-2xl">
                <Wheat className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-700">Nenhum ingrediente encontrado</p>
                <p className="text-xs text-stone-500 mt-1">
                  Cadastre seu primeiro insumo no formulário ao lado.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold text-xs uppercase tracking-wider bg-stone-50/50">
                      <th className="py-3 px-4">Insumo</th>
                      <th className="py-3 px-4 text-center">Unidade</th>
                      <th className="py-3 px-4 text-right">Qtd. Cadastrada</th>
                      <th className="py-3 px-4 text-right">Custo</th>
                      <th className="py-3 px-4 text-right">Custo / Unidade</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {ingredientesFiltrados.map((i) => {
                      const preco = i.historicoPrecos[0];
                      const unidadeStr = i.unidadeBase === "UNIDADE" ? "un" : "kg";
                      const custoUnitarioCalculado = preco
                        ? (preco.precoEmbalagem / (preco.tamanhoEmbalagem || 1)) / 100
                        : 0;

                      return (
                        <tr key={i.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-stone-900">
                            {i.nome}
                            {i.historicoPrecos.length > 1 && (
                              <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] rounded font-bold">
                                {i.historicoPrecos.length} compras
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-bold text-xs rounded-md">
                              {unidadeStr.toUpperCase()}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right text-stone-700 text-xs font-semibold">
                            {preco ? `${preco.tamanhoEmbalagem} ${unidadeStr}` : "-"}
                          </td>

                          <td className="py-3 px-4 text-right text-stone-900 font-black text-xs">
                            {preco ? formatarCentavosParaReal(preco.precoEmbalagem) : "-"}
                          </td>

                          <td className="py-3 px-4 text-right font-black text-amber-950 text-sm">
                            {preco ? (
                              <>
                                R$ {custoUnitarioCalculado.toFixed(2)}
                                <span className="text-[10px] font-normal text-stone-400 block">
                                  por {unidadeStr}
                                </span>
                              </>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
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
    </div>
  );
}
