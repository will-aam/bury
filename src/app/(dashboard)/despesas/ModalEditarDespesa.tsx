"use client";

import { useState, useTransition } from "react";
import { editarDespesaAction, excluirDespesaAction } from "@/app/actions/despesas";
import { Edit2, Trash2, X, AlertCircle } from "lucide-react";

interface Categoria {
  id: string;
  nome: string;
}

interface Despesa {
  id: string;
  descricao: string;
  categoriaId: string;
  quantidade: number;
  valor: number;
  data: string | Date;
  status: "PAGO" | "PENDENTE";
}

export default function ModalEditarDespesa({
  despesa,
  categorias,
}: {
  despesa: Despesa;
  categorias: Categoria[];
}) {
  const [aberto, setAberto] = useState(false);
  const [descricao, setDescricao] = useState(despesa.descricao);
  const [categoriaId, setCategoriaId] = useState(despesa.categoriaId);
  const [quantidade, setQuantidade] = useState(
    despesa.quantidade != null ? despesa.quantidade.toString() : "1"
  );
  const [valor, setValor] = useState((despesa.valor / 100).toFixed(2).replace(".", ","));
  const [status, setStatus] = useState<"PAGO" | "PENDENTE">(despesa.status);
  
  const dataFormatada =
    despesa.data instanceof Date
      ? despesa.data.toISOString().split("T")[0]
      : typeof despesa.data === "string"
      ? despesa.data.split("T")[0]
      : new Date().toISOString().split("T")[0];

  const [data, setData] = useState(dataFormatada);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const formData = new FormData();
    formData.append("id", despesa.id);
    formData.append("descricao", descricao);
    formData.append("categoriaId", categoriaId);
    formData.append("quantidade", quantidade);
    formData.append("valor", valor);
    formData.append("status", status);
    formData.append("data", data);

    startTransition(async () => {
      const res = await editarDespesaAction(formData);
      if (res?.erro) {
        setErro(res.erro);
      } else {
        setAberto(false);
      }
    });
  };

  const handleExcluir = () => {
    if (!confirm(`Deseja realmente apagar o lançamento "${despesa.descricao}"?`)) return;

    const formData = new FormData();
    formData.append("id", despesa.id);

    startTransition(async () => {
      const res = await excluirDespesaAction(formData);
      if (res?.erro) {
        alert(res.erro);
      } else {
        setAberto(false);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDescricao(despesa.descricao);
          setCategoriaId(despesa.categoriaId);
          setQuantidade(despesa.quantidade != null ? despesa.quantidade.toString() : "1");
          setValor((despesa.valor / 100).toFixed(2).replace(".", ","));
          setStatus(despesa.status);
          setData(dataFormatada);
          setErro(null);
          setAberto(true);
        }}
        className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
        title="Editar Despesa"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-bold text-stone-900 text-base">Editar Lançamento de Despesa</h3>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleSalvar} className="space-y-4">
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
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 bg-white placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
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
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 bg-white outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
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
                    placeholder="85,50"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 bg-white placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 bg-white outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "PAGO" | "PENDENTE")}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 bg-white outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
                  >
                    <option value="PAGO" className="text-stone-900 bg-white">Pago</option>
                    <option value="PENDENTE" className="text-stone-900 bg-white">A Pagar (Pendente)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-100 gap-3">
                <button
                  type="button"
                  onClick={handleExcluir}
                  disabled={isPending}
                  className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-rose-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAberto(false)}
                    className="px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    {isPending ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
