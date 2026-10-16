"use client";

import { useState, useMemo } from "react";
import { formatarCentavosParaReal } from "@/lib/formatadores";
import {
  Cake,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Tag,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  Edit2,
  FileSpreadsheet,
} from "lucide-react";
import { criarProdutoAction, alternarStatusProdutoAction } from "@/app/actions/produtos";
import ModalEditarProduto from "./ModalEditarProduto";
import ModalFichaTecnica, { FichaTecnicaData } from "./ModalFichaTecnica";

interface Produto {
  id: string;
  nome: string;
  precoVenda: number;
  precoSecundario: number;
  rendimento: number;
  ativo: boolean;
  fichaTecnica?: FichaTecnicaData | null;
}

export default function ListaEFormularioProdutos({
  produtosIniciais,
}: {
  produtosIniciais: Produto[];
}) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativos" | "inativos">("todos");
  const [mostrarForm, setMostrarForm] = useState(false);

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(8);

  // Estados do formulário de criação rápida
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [precoSecundario, setPrecoSecundario] = useState("");
  const [rendimento, setRendimento] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Atualizar Preço Diferenciado automaticamente se o usuário ainda não tiver editado
  const handlePrecoChange = (val: string) => {
    setPreco(val);
    if (!precoSecundario) {
      setPrecoSecundario(val);
    }
  };

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("preco", preco);
    formData.append("precoSecundario", precoSecundario || preco);
    formData.append("rendimento", rendimento.toString());

    const res = await criarProdutoAction(formData);
    setIsSubmitting(false);

    if (res?.erro) {
      setErro(res.erro);
    } else {
      setNome("");
      setPreco("");
      setPrecoSecundario("");
      setRendimento(1);
      setMostrarForm(false);
    }
  };

  // Filtragem
  const produtosFiltrados = useMemo(() => {
    return produtosIniciais.filter((p) => {
      const matchTexto = p.nome.toLowerCase().includes(busca.toLowerCase());
      if (!matchTexto) return false;

      if (filtroStatus === "ativos") return p.ativo;
      if (filtroStatus === "inativos") return !p.ativo;
      return true;
    });
  }, [produtosIniciais, busca, filtroStatus]);

  // Paginação calculada
  const totalPaginas = Math.max(1, Math.ceil(produtosFiltrados.length / itensPorPagina));
  const paginaAjustada = Math.min(paginaAtual, totalPaginas);

  const produtosPaginados = useMemo(() => {
    const inicio = (paginaAjustada - 1) * itensPorPagina;
    return produtosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [produtosFiltrados, paginaAjustada, itensPorPagina]);

  // Métricas
  const totalAtivos = produtosIniciais.filter((p) => p.ativo).length;
  const precoMedioVarejo =
    produtosIniciais.length > 0
      ? Math.round(produtosIniciais.reduce((acc, p) => acc + p.precoVenda, 0) / produtosIniciais.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header com Métricas de Catálogo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Total de Produtos
            </span>
            <div className="text-2xl font-black text-stone-900 mt-1">{produtosIniciais.length}</div>
            <span className="text-xs text-stone-500">{totalAtivos} ativos para venda</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Cake className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Preço Médio Padrão
            </span>
            <div className="text-2xl font-black text-stone-900 mt-1">
              {formatarCentavosParaReal(precoMedioVarejo)}
            </div>
            <span className="text-xs text-stone-500">Média de varejo/balcão</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Tabela Dupla Ativa
            </span>
            <div className="text-sm font-bold text-stone-800 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Padrão & Diferenciado
            </div>
            <span className="text-xs text-stone-500">Pronto para revenda e atacado</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
            <Tag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Barra de Ações & Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome do bolo ou sabor..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPaginaAtual(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 hover:bg-stone-100/80 focus:bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {/* Filtro Status */}
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold text-stone-600">
            <button
              type="button"
              onClick={() => {
                setFiltroStatus("todos");
                setPaginaAtual(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroStatus === "todos" ? "bg-white text-stone-900 shadow-xs" : "hover:text-stone-900"
              }`}
            >
              Todos ({produtosIniciais.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFiltroStatus("ativos");
                setPaginaAtual(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroStatus === "ativos" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-stone-900"
              }`}
            >
              Ativos ({totalAtivos})
            </button>
            <button
              type="button"
              onClick={() => {
                setFiltroStatus("inativos");
                setPaginaAtual(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroStatus === "inativos" ? "bg-white text-stone-900 shadow-xs" : "hover:text-stone-900"
              }`}
            >
              Inativos ({produtosIniciais.length - totalAtivos})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMostrarForm(!mostrarForm)}
            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow transition"
          >
            <Plus className="w-4 h-4" />
            {mostrarForm ? "Fechar Cadastro" : "Novo Produto"}
          </button>
        </div>
      </div>

      {/* 3. Painel Retrátil / Card de Cadastro Elegante */}
      {mostrarForm && (
        <div className="bg-gradient-to-br from-amber-50/60 via-white to-stone-50 p-5 sm:p-6 rounded-2xl border-2 border-amber-200/80 shadow-md animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">Cadastrar Novo Produto</h3>
                <p className="text-xs text-stone-500">Defina o nome e os dois preços praticados</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="text-stone-400 hover:text-stone-700 text-xs font-semibold px-2 py-1 rounded-md"
            >
              Cancelar
            </button>
          </div>

          {erro && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {erro}
            </div>
          )}

          <form onSubmit={handleCriar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end">
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Nome do Bolo / Sabor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bolo de Cenoura com Ganache"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Preço Padrão (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 30,00"
                  value={preco}
                  onChange={(e) => handlePrecoChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs"
                />
                <span className="text-[10px] text-stone-500 mt-0.5 block font-medium">Varejo / Balcão</span>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Preço Diferenciado (R$)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 22,00"
                  value={precoSecundario}
                  onChange={(e) => setPrecoSecundario(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-50/60 border border-amber-300 rounded-xl text-sm font-bold text-amber-950 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs"
                />
                <span className="text-[10px] text-amber-800 mt-0.5 block font-medium">Revenda / Atacado</span>
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Rend.
                </label>
                <input
                  type="number"
                  min="1"
                  value={rendimento}
                  onChange={(e) => setRendimento(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs"
                />
                <span className="text-[10px] text-stone-500 mt-0.5 block font-medium">Unid.</span>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 4. Tabela de Produtos com Design Clean, Responsiva e Paginada */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Topo da Tabela: Contadores e seletor de itens por página */}
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span>
              Mostrando{" "}
              <strong>
                {produtosFiltrados.length === 0
                  ? 0
                  : (paginaAjustada - 1) * itensPorPagina + 1}
                -
                {Math.min(paginaAjustada * itensPorPagina, produtosFiltrados.length)}
              </strong>{" "}
              de <strong>{produtosFiltrados.length}</strong> produtos
            </span>
            {busca && (
              <button
                onClick={() => {
                  setBusca("");
                  setPaginaAtual(1);
                }}
                className="text-amber-700 hover:underline font-bold ml-1"
              >
                (Limpar busca)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span>Linhas por página:</span>
            <select
              value={itensPorPagina}
              onChange={(e) => {
                setItensPorPagina(Number(e.target.value));
                setPaginaAtual(1);
              }}
              className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {produtosPaginados.length === 0 ? (
          <div className="p-12 text-center">
            <Cake className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-bold text-stone-700 text-base">Nenhum produto encontrado</h3>
            <p className="text-xs text-stone-500 mt-1">Tente ajustar a busca ou os filtros de status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Produto / Sabor</th>
                  <th className="py-3.5 px-3 text-center">Rendimento</th>
                  <th className="py-3.5 px-4 text-right">Custo (Ficha)</th>
                  <th className="py-3.5 px-4 text-right">Preço Padrão (Varejo)</th>
                  <th className="py-3.5 px-4 text-right">Preço Diferenciado (Atacado)</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {produtosPaginados.map((p) => {
                  const custoTotalFicha = p.fichaTecnica?.itens?.reduce((acc, i) => acc + (i.custoCalculado || 0), 0) || 0;
                  const custoUnitario = p.rendimento > 0 ? Math.round(custoTotalFicha / p.rendimento) : custoTotalFicha;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-amber-50/40 transition-colors ${
                        !p.ativo ? "opacity-60 bg-stone-50/50" : ""
                      }`}
                    >
                      {/* Nome do Produto */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className="font-bold text-stone-900">{p.nome}</span>
                      </td>

                      {/* Rendimento */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md font-medium">
                          <Layers className="w-3 h-3 text-stone-400" />
                          {p.rendimento} un
                        </span>
                      </td>

                      {/* Custo Calculado da Ficha Técnica */}
                      <td className="py-3.5 px-4 text-right">
                        {custoUnitario > 0 ? (
                          <div className="font-extrabold text-stone-900 text-sm">
                            {formatarCentavosParaReal(custoUnitario)}
                            <span className="text-[10px] text-stone-400 font-normal block">
                              por unidade
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-xs italic">
                            Sem ficha
                          </span>
                        )}
                      </td>

                      {/* Preço Padrão */}
                      <td className="py-3.5 px-4 text-right font-black text-stone-900 text-base">
                        {formatarCentavosParaReal(p.precoVenda)}
                      </td>

                      {/* Preço Diferenciado */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 font-bold text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
                          {formatarCentavosParaReal(p.precoSecundario || p.precoVenda)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        {p.ativo ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-stone-500 text-xs font-bold bg-stone-100 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5" /> Inativo
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.ativo ? (
                            <>
                              <ModalFichaTecnica produto={p} />
                              <ModalEditarProduto produto={p} />
                            </>
                          ) : (
                            <span
                              className="p-1.5 text-stone-300 cursor-not-allowed rounded-lg inline-block"
                              title="Ative o produto para poder editá-lo"
                            >
                              <Edit2 className="w-4 h-4" />
                            </span>
                          )}
                          <form
                            action={async (formData) => {
                              await alternarStatusProdutoAction(formData);
                            }}
                          >
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="ativo" value={p.ativo ? "true" : "false"} />
                            <button
                              type="submit"
                              className={`text-xs font-bold px-2 py-1 rounded-md transition ${
                                p.ativo
                                  ? "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                                  : "text-amber-800 bg-amber-100/70 hover:bg-amber-100 font-extrabold"
                              }`}
                            >
                              {p.ativo ? "Desativar" : "Ativar"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé da Tabela com Paginação */}
        {totalPaginas > 1 && (
          <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
            <div>
              Página <strong>{paginaAjustada}</strong> de <strong>{totalPaginas}</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                disabled={paginaAjustada <= 1}
                className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Página Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Botões numéricos de página */}
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pg) => {
                // Exibe página 1, última página e as adjacentes
                if (pg === 1 || pg === totalPaginas || Math.abs(pg - paginaAjustada) <= 1) {
                  return (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setPaginaAtual(pg)}
                      className={`min-w-8 h-8 px-2 rounded-lg font-bold transition text-xs ${
                        pg === paginaAjustada
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-white border border-stone-200 hover:bg-stone-50 text-stone-700"
                      }`}
                    >
                      {pg}
                    </button>
                  );
                } else if (
                  (pg === 2 && paginaAjustada > 3) ||
                  (pg === totalPaginas - 1 && paginaAjustada < totalPaginas - 2)
                ) {
                  return (
                    <span key={pg} className="px-1 text-stone-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
                disabled={paginaAjustada >= totalPaginas}
                className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Próxima Página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
