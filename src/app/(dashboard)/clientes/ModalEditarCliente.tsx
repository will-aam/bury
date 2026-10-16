"use client";

import { useState, useTransition } from "react";
import { editarClienteAction, excluirClienteAction, alternarStatusClienteAction } from "@/app/actions/clientes";
import { Edit2, Trash2, X } from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  tipo: "CONSUMIDOR_FINAL" | "REVENDEDOR";
  telefone: string | null;
  endereco: string | null;
  observacoes: string | null;
  ativo: boolean;
  isPadrao: boolean;
}

export default function ModalEditarCliente({
  cliente,
}: {
  cliente: Cliente;
}) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(cliente.nome);
  const [tipo, setTipo] = useState(cliente.tipo);
  const [telefone, setTelefone] = useState(cliente.telefone || "");
  const [endereco, setEndereco] = useState(cliente.endereco || "");
  const [observacoes, setObservacoes] = useState(cliente.observacoes || "");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const formData = new FormData();
    formData.append("id", cliente.id);
    formData.append("nome", nome);
    formData.append("tipo", tipo);
    formData.append("telefone", telefone);
    formData.append("endereco", endereco);
    formData.append("observacoes", observacoes);

    startTransition(async () => {
      const res = await editarClienteAction(formData);
      if (res?.erro) {
        setErro(res.erro);
      } else {
        setAberto(false);
      }
    });
  };

  const handleExcluir = () => {
    if (!confirm(`Deseja realmente apagar/desativar o cliente "${cliente.nome}"?`)) return;

    const formData = new FormData();
    formData.append("id", cliente.id);

    startTransition(async () => {
      const res = await excluirClienteAction(formData);
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
        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
        title="Editar Cliente"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-stone-900 text-lg">Editar Cliente</h3>
              <button onClick={() => setAberto(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="my-3 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {erro}
              </div>
            )}

            <form onSubmit={handleSalvar} className="space-y-3.5 my-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Tipo
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900 font-medium"
                >
                  <option value="CONSUMIDOR_FINAL">Consumidor Final (Direto)</option>
                  <option value="REVENDEDOR">Revendedor (Recorrente)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm text-stone-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
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
                  className="flex-1 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow transition"
                >
                  {isPending ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>

            {!cliente.isPadrao && (
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="text-xs text-stone-400">Ações perigosas:</span>
                <button
                  type="button"
                  onClick={handleExcluir}
                  disabled={isPending}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir Cliente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
