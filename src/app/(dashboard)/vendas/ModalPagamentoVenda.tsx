"use client";

import { useState, useTransition } from "react";
import { formatarCentavosParaReal } from "@/lib/formatadores";
import { adicionarPagamentoVendaAction } from "@/app/actions/vendas";
import { DollarSign, X } from "lucide-react";

export default function ModalPagamentoVenda({
  vendaId,
  clienteNome,
  saldoDevedor,
}: {
  vendaId: string;
  clienteNome: string;
  saldoDevedor: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState((saldoDevedor / 100).toFixed(2));
  const [forma, setForma] = useState("PIX");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const formData = new FormData();
    formData.append("vendaId", vendaId);
    formData.append("valor", valor);
    formData.append("forma", forma);

    startTransition(async () => {
      const res = await adicionarPagamentoVendaAction(formData);
      if (res?.erro) {
        setErro(res.erro);
      } else {
        setAberto(false);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition"
      >
        <DollarSign className="w-3.5 h-3.5" /> Receber
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg">Receber Pagamento</h3>
                <p className="text-xs text-stone-500">Cliente: {clienteNome}</p>
              </div>
              <button onClick={() => setAberto(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              Saldo em aberto desta venda:{" "}
              <strong className="text-sm font-black text-rose-700">
                {formatarCentavosParaReal(saldoDevedor)}
              </strong>
            </div>

            {erro && (
              <div className="mb-4 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {erro}
              </div>
            )}

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Valor a Receber (R$)
                </label>
                <input
                  type="text"
                  required
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={forma}
                  onChange={(e) => setForma(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-stone-900 font-semibold"
                >
                  <option value="PIX">Pix</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="OUTRO">Outro</option>
                </select>
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
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow transition"
                >
                  {isPending ? "Gravando..." : "Confirmar Recebimento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
