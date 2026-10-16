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
  ToggleLeft,
  ToggleRight,
  Filter,
} from "lucide-react";
import { criarProdutoAction, alternarStatusProdutoAction } from "@/app/actions/produtos";
import ModalEditarProduto from "./ModalEditarProduto";

interface Produto {
  id: string;
  nome: string;
  precoVenda: number;
  precoSecundario: number;
  rendimento: number;
  ativo: boolean;
}

export default function ListaEFormularioProdutos({
  produtosIniciais,
}: {
  produtosIniciais: Produto[];
}) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativos" | "inativos">("todos");
  const [mostrarForm, setMostrarForm] = useState(false);

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
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 hover:bg-stone-100/80 focus:bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Filtro Status */}
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold text-stone-600">
            <button
              type="button"
              onClick={() => setFiltroStatus("todos")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroStatus === "todos" ? "bg-white text-stone-900 shadow-xs" : "hover:text-stone-900"
              }`}
            >
              Todos ({produtosIniciais.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus("ativos")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroStatus === "ativos" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-stone-900"
              }`}
            >
              Ativos ({totalAtivos})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus("inativos")}
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

      {/* 4. Lista Principal de Produtos: Cards Modernos (Grid) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-stone-500 px-1">
          <span>
            Exibindo <strong>{produtosFiltrados.length}</strong> de {produtosIniciais.length} produtos
          </span>
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="text-amber-700 hover:underline font-bold"
            >
              Limpar busca
            </button>
          )}
        </div>

        {produtosFiltrados.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center">
            <Cake className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-bold text-stone-700 text-base">Nenhum produto encontrado</h3>
            <p className="text-xs text-stone-500 mt-1">Tente buscar com outro termo ou ajuste os filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {produtosFiltrados.map((p) => {
              const temDiferenca = p.precoSecundario && p.precoSecundario !== p.precoVenda;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                    p.ativo ? "border-stone-200 hover:border-amber-300" : "border-stone-200/60 opacity-60 bg-stone-50/50"
                  }`}
                >
                  {/* Topo do Card */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-extrabold text-stone-900 text-base tracking-tight leading-snug">
                            {p.nome}
                          </h3>
                          {p.nome.toUpperCase().includes("BB") && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] rounded-full font-bold">
                              BB (Pequeno)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-stone-400" /> Rendimento: {p.rendimento} un
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <ModalEditarProduto produto={p} />
                      </div>
                    </div>

                    {/* Preços Lado a Lado (Design em Pílulas/Blocos Elegantes) */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-100">
                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                          Preço Padrão
                        </span>
                        <div className="text-base sm:text-lg font-black text-stone-900 mt-0.5">
                          {formatarCentavosParaReal(p.precoVenda)}
                        </div>
                        <span className="text-[10px] text-stone-400 font-medium">Consumidor / Varejo</span>
                      </div>

                      <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/70">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block flex items-center justify-between">
                          Diferenciado
                          {temDiferenca && (
                            <span className="text-[9px] bg-amber-200/70 text-amber-900 px-1 py-0.2 rounded font-extrabold">
                              Especial
                            </span>
                          )}
                        </span>
                        <div className="text-base sm:text-lg font-black text-amber-950 mt-0.5">
                          {formatarCentavosParaReal(p.precoSecundario || p.precoVenda)}
                        </div>
                        <span className="text-[10px] text-amber-700 font-medium">Revendedor / Atacado</span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card com Ação Rápida */}
                  <div className="bg-stone-50/80 px-4 py-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold">
                      {p.ativo ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="text-emerald-700">Disponível para venda</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                          <span className="text-stone-500">Inativo</span>
                        </>
                      )}
                    </span>

                    <form action={async (formData) => {
                      await alternarStatusProdutoAction(formData);
                    }}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="ativo" value={p.ativo ? "true" : "false"} />
                      <button
                        type="submit"
                        className="font-bold text-stone-500 hover:text-stone-900 transition flex items-center gap-1 text-[11px]"
                      >
                        {p.ativo ? "Pausar" : "Reativar"}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
