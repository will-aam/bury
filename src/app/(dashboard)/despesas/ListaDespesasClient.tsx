"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatarCentavosParaReal, formatarDataPtBr } from "@/lib/formatadores";
import {
  Receipt,
  Plus,
  Tag,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import ModalEditarDespesa from "./ModalEditarDespesa";
import { criarDespesaAction, criarCategoriaAction } from "@/app/actions/despesas";

interface Categoria {
  id: string;
  nome: string;
}

interface DespesaItem {
  id: string;
  data: string | Date;
  descricao: string;
  categoriaId: string;
  categoria: Categoria;
  quantidade: number;
  valor: number;
  status: "PAGO" | "PENDENTE";
}

interface ListaDespesasProps {
  despesas: DespesaItem[];
  categorias: Categoria[];
  totalItens: number;
  paginaAtual: number;
  totalPaginas: number;
  itensPorPagina: number;
  buscaInicial: string;
  statusInicial: string;
  categoriaInicial: string;
}

export default function ListaDespesasClient({
  despesas,
  categorias,
  totalItens,
  paginaAtual,
  totalPaginas,
  itensPorPagina,
  buscaInicial,
  statusInicial,
  categoriaInicial,
}: ListaDespesasProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados dos filtros
  const [busca, setBusca] = useState(buscaInicial);
  const [statusFiltro, setStatusFiltro] = useState(statusInicial);
  const [categoriaFiltro, setCategoriaFiltro] = useState(categoriaInicial);

  // Estados do formulário de criação rápida
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id || "");
  const [quantidade, setQuantidade] = useState("1");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [statusNovo, setStatusNovo] = useState<"PAGO" | "PENDENTE">("PAGO");
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Estado categoria nova
  const [nomeNovaCategoria, setNomeNovaCategoria] = useState("");
  const [erroCategoria, setErroCategoria] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const atualizarFiltrosNaUrl = (novosParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(novosParams).forEach(([key, val]) => {
      if (val === "" || val === "todos" || val === 1 && key === "pagina") {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });

    startTransition(() => {
      router.push(`/despesas?${params.toString()}`);
    });
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    atualizarFiltrosNaUrl({
      busca,
      status: statusFiltro,
      categoria: categoriaFiltro,
      pagina: 1,
    });
  };

  const handleMudarPagina = (novaPagina: number) => {
    if (novaPagina < 1 || novaPagina > totalPaginas) return;
    atualizarFiltrosNaUrl({
      pagina: novaPagina,
    });
  };

  const handleCriarDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    const formData = new FormData();
    formData.append("descricao", descricao);
    formData.append("categoriaId", categoriaId || categorias[0]?.id || "");
    formData.append("quantidade", quantidade || "1");
    formData.append("valor", valor);
    formData.append("data", data);
    formData.append("status", statusNovo);

    startTransition(async () => {
      const res = await criarDespesaAction(formData);
      if (res?.erro) {
        setErroForm(res.erro);
      } else {
        setDescricao("");
        setQuantidade("1");
        setValor("");
        setData(new Date().toISOString().split("T")[0]);
        setStatusNovo("PAGO");
      }
    });
  };

  const handleCriarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroCategoria(null);

    const formData = new FormData();
    formData.append("nome", nomeNovaCategoria);

    startTransition(async () => {
      const res = await criarCategoriaAction(formData);
      if (res?.erro) {
        setErroCategoria(res.erro);
      } else {
        setNomeNovaCategoria("");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna Esquerda: Formulário de Lançamento e Criação de Categoria */}
      <div className="space-y-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-stone-700" />
            Lançar Nova Despesa
          </h2>

          {erroForm && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erroForm}</span>
            </div>
          )}

          <form onSubmit={handleCriarDespesa} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Descrição do Gasto
              </label>
              <input
                type="text"
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Compra ovos e farinha"
                className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 bg-white placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Categoria
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none bg-white"
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id} className="text-stone-900 bg-white py-1">
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Valor Total (R$)
                </label>
                <input
                  type="text"
                  required
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="Ex: 85,50"
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 bg-white focus:ring-2 focus:ring-stone-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={statusNovo}
                  onChange={(e) => setStatusNovo(e.target.value as "PAGO" | "PENDENTE")}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 outline-none bg-white focus:ring-2 focus:ring-stone-900"
                >
                  <option value="PAGO" className="text-stone-900 bg-white">Pago</option>
                  <option value="PENDENTE" className="text-stone-900 bg-white">A Pagar (Pendente)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Salvando..." : "Salvar Despesa"}
            </button>
          </form>
        </div>

        {/* Adicionar Categoria Rápida */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-xs font-bold text-stone-700 uppercase mb-3 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-stone-700" />
            Adicionar Nova Categoria
          </h3>
          {erroCategoria && (
            <p className="text-xs text-rose-600 mb-2">{erroCategoria}</p>
          )}
          <form onSubmit={handleCriarCategoria} className="flex gap-2">
            <input
              type="text"
              required
              value={nomeNovaCategoria}
              onChange={(e) => setNomeNovaCategoria(e.target.value)}
              placeholder="Ex: Impostos, Água..."
              className="flex-1 px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-stone-900"
            />
            <button
              type="submit"
              disabled={isPending}
              className="bg-stone-900 hover:bg-black text-white font-bold text-xs px-3 py-2 rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              Criar
            </button>
          </form>
        </div>
      </div>

      {/* Coluna Direita: Lista / Tabela com Paginação, Busca e Edição */}
      <div className="lg:col-span-2 space-y-4">
        {/* Barra Superior da Tabela: Busca, Filtros e Total */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-stone-700" />
              Lançamentos de Despesas ({totalItens})
            </h2>

            {/* Contador de páginas */}
            <span className="text-xs text-stone-500 font-medium">
              Página {paginaAtual} de {totalPaginas}
            </span>
          </div>

          <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:border-stone-400 outline-none transition"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFiltro}
                onChange={(e) => {
                  setStatusFiltro(e.target.value);
                  atualizarFiltrosNaUrl({
                    status: e.target.value,
                    pagina: 1,
                  });
                }}
                className="px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 font-medium outline-none"
              >
                <option value="todos">Status: Todos</option>
                <option value="PAGO">Pago</option>
                <option value="PENDENTE">Pendente</option>
              </select>

              <select
                value={categoriaFiltro}
                onChange={(e) => {
                  setCategoriaFiltro(e.target.value);
                  atualizarFiltrosNaUrl({
                    categoria: e.target.value,
                    pagina: 1,
                  });
                }}
                className="px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 font-medium outline-none max-w-[140px] truncate"
              >
                <option value="todas">Categoria: Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="bg-stone-900 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>

        {/* Cards Mobile */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {despesas.length === 0 ? (
            <div className="p-8 text-center text-stone-500 bg-white rounded-2xl border">
              Nenhuma despesa encontrada.
            </div>
          ) : (
            despesas.map((d) => (
              <div
                key={d.id}
                className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-bold text-stone-900 text-sm">{d.descricao}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full font-medium">
                      {d.categoria.nome}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {formatarDataPtBr(d.data)}
                    </span>
                    <span className="text-[11px] font-semibold text-stone-700 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200">
                      Qtd: {d.quantidade ?? 1}
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-1 shrink-0">
                  <div className="text-base font-black text-rose-700">
                    {formatarCentavosParaReal(d.valor)}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    {d.status === "PAGO" ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Pago
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                        Pendente
                      </span>
                    )}
                    <ModalEditarDespesa despesa={d} categorias={categorias} />
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
                  <th className="pb-3 text-center">Qtd</th>
                  <th className="pb-3 text-right">Valor</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {despesas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-stone-500">
                      Nenhuma despesa encontrada.
                    </td>
                  </tr>
                ) : (
                  despesas.map((d) => (
                    <tr key={d.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 font-medium text-stone-900 whitespace-nowrap">
                        {formatarDataPtBr(d.data)}
                      </td>
                      <td className="py-3 font-semibold text-stone-900">
                        {d.descricao}
                      </td>
                      <td className="py-3">
                        <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          {d.categoria.nome}
                        </span>
                      </td>
                      <td className="py-3 text-center font-bold text-stone-700">
                        {d.quantidade ?? 1}
                      </td>
                      <td className="py-3 text-right font-black text-rose-700 whitespace-nowrap">
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
                      <td className="py-3 text-center">
                        <ModalEditarDespesa despesa={d} categorias={categorias} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé da Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-stone-100 text-xs text-stone-600">
              <div>
                Mostrando{" "}
                <span className="font-semibold text-stone-900">
                  {Math.min((paginaAtual - 1) * itensPorPagina + 1, totalItens)}
                </span>{" "}
                a{" "}
                <span className="font-semibold text-stone-900">
                  {Math.min(paginaAtual * itensPorPagina, totalItens)}
                </span>{" "}
                de <span className="font-semibold text-stone-900">{totalItens}</span> lançamentos
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMudarPagina(paginaAtual - 1)}
                  disabled={paginaAtual <= 1 || isPending}
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Página Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter((p) => {
                    return (
                      p === 1 ||
                      p === totalPaginas ||
                      Math.abs(p - paginaAtual) <= 1
                    );
                  })
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <div key={p} className="flex items-center">
                        {showEllipsis && <span className="px-1 text-stone-400">...</span>}
                        <button
                          type="button"
                          onClick={() => handleMudarPagina(p)}
                          disabled={isPending}
                          className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                            paginaAtual === p
                              ? "bg-stone-900 text-white"
                              : "hover:bg-stone-100 text-stone-700"
                          }`}
                        >
                          {p}
                        </button>
                      </div>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => handleMudarPagina(paginaAtual + 1)}
                  disabled={paginaAtual >= totalPaginas || isPending}
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Próxima Página"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Paginação Mobile */}
        {totalPaginas > 1 && (
          <div className="flex md:hidden items-center justify-between bg-white p-3 rounded-2xl border border-stone-200 text-xs text-stone-600">
            <span>
              Página {paginaAtual} de {totalPaginas}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleMudarPagina(paginaAtual - 1)}
                disabled={paginaAtual <= 1 || isPending}
                className="px-3 py-1.5 rounded-xl border border-stone-200 font-semibold disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => handleMudarPagina(paginaAtual + 1)}
                disabled={paginaAtual >= totalPaginas || isPending}
                className="px-3 py-1.5 rounded-xl border border-stone-200 font-semibold disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
