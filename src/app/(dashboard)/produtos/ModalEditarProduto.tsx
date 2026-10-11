"use client";

import { useState, useTransition } from "react";
import { editarProdutoAction, excluirProdutoAction, alternarStatusProdutoAction } from "@/app/actions/produtos";
import { Edit2, Trash2, X, CheckCircle2, AlertTriangle } from "lucide-react";

interface Produto {
  id: string;
  nome: string;
  precoVenda: number;
  rendimento: number;
  ativo: boolean;
}

export default function ModalEditarProduto({
  produto,
}: {
  produto: Produto;
}) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(produto.nome);
  const [preco, setPreco] = useState((produto.precoVenda / 100).toFixed(2));
  const [rendimento, setRendimento] = useState(produto.rendimento);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSalvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const formData = new FormData();
    formData.append("id", produto.id);
    formData.append("nome", nome);
    formData.append("preco", preco);
    formData.append("rendimento", rendimento.toString());

    startTransition(async () => {
      const res = await editarProdutoAction(formData);
      if (res?.erro) {
        setErro(res.erro);
      } else {
        setAberto(false);
      }
    });
  };

  const handleExcluir = () => {
    if (!confirm(`Deseja realmente apagar/desativar o produto "${produto.nome}"?`)) return;

    const formData = new FormData();
    formData.append("id", produto.id);

    startTransition(async () => {
      const res = await excluirProdutoAction(formData);
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
        onClick={() => setAberto(true)}
        className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-stone-100 rounded-lg transition"
        title="Editar Produto"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-stone-900 text-lg">Editar Produto</h3>
              <button onClick={() => setAberto(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="my-3 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {erro}
              </div>
            )}

            <form onSubmit={handleSalvarEdicao} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Nome do Produto / Sabor
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
                    Preço de Venda (R$)
                  </label>
                  <input
                    type="text"
                    required
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Rendimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={rendimento}
                    onChange={(e) => setRendimento(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="flex-1 py-2.5 border rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow transition"
                >
                  {isPending ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>

            <div className="pt-3 border-t flex justify-between items-center">
              <span className="text-xs text-stone-400">Ações perigosas:</span>
              <button
                type="button"
                onClick={handleExcluir}
                disabled={isPending}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Produto
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
