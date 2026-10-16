"use client";

import { useState, useTransition, useRef } from "react";
import { formatarCentavosParaReal } from "@/lib/formatadores";
import { Plus, Trash2, CheckCircle2, UserPlus } from "lucide-react";
import { criarVendaRapidaAction } from "@/app/actions/vendas";
import { useRouter } from "next/navigation";

interface ClienteOption {
  id: string;
  nome: string;
  isPadrao: boolean;
  tipo?: string;
}

interface ProdutoOption {
  id: string;
  nome: string;
  precoVenda: number;
  precoSecundario?: number;
}

interface ItemForm {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export default function FormularioVendaRapida({
  clientes,
  produtos,
}: {
  clientes: ClienteOption[];
  produtos: ProdutoOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Cliente padrão inicial
  const clientePadrao = clientes.find((c) => c.isPadrao) || clientes[0];
  const [clienteId, setClienteId] = useState(clientePadrao?.id || "");
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().split("T")[0]);
  const [observacoes, setObservacoes] = useState("");

  // Retorna se o cliente atual usa preço diferenciado (ex: Revendedor)
  const clienteAtual = clientes.find((c) => c.id === clienteId);
  const isClienteDiferenciado = clienteAtual?.tipo === "REVENDEDOR";

  // Itens da venda
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState(produtos[0]?.id || "");
  const [quantidadeItem, setQuantidadeItem] = useState(1);

  const obterPrecoSugerido = (prodId: string, clienteDiff: boolean) => {
    const prod = produtos.find((p) => p.id === prodId);
    if (!prod) return "0.00";
    const valorCentavos = clienteDiff && prod.precoSecundario ? prod.precoSecundario : prod.precoVenda;
    return (valorCentavos / 100).toFixed(2);
  };

  const [precoItemPersonalizado, setPrecoItemPersonalizado] = useState(
    obterPrecoSugerido(produtos[0]?.id || "", isClienteDiferenciado)
  );

  // Pagamento imediato
  const [tipoPagamento, setTipoPagamento] = useState<"QUITADO" | "FIADO" | "PARCIAL">("QUITADO");
  const [formaPagamento, setFormaPagamento] = useState<"PIX" | "DINHEIRO" | "CARTAO_CREDITO" | "CARTAO_DEBITO">("PIX");
  const [valorPagoCustom, setValorPagoCustom] = useState("");
  const [dataPrevistaPgto, setDataPrevistaPgto] = useState("");

  const inputQtdRef = useRef<HTMLInputElement>(null);

  // Total da venda em centavos
  const totalVendaCentavos = itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);

  // Ao trocar de cliente, reavalia o preço sugerido do produto atual
  const handleClienteChange = (novoClienteId: string) => {
    setClienteId(novoClienteId);
    const cli = clientes.find((c) => c.id === novoClienteId);
    const clienteDiff = cli?.tipo === "REVENDEDOR";
    setPrecoItemPersonalizado(obterPrecoSugerido(produtoSelecionadoId, clienteDiff));
  };

  // Ao trocar de produto selecionado no dropdown rápido
  const handleProdutoChange = (novoId: string) => {
    setProdutoSelecionadoId(novoId);
    setPrecoItemPersonalizado(obterPrecoSugerido(novoId, isClienteDiferenciado));
  };

  // Adicionar item à cesta (Enter)
  const adicionarItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prod = produtos.find((p) => p.id === produtoSelecionadoId);
    if (!prod || quantidadeItem <= 0) return;

    const precoCentavos = Math.round(parseFloat(precoItemPersonalizado.replace(",", ".")) * 100);

    setItens([
      ...itens,
      {
        produtoId: prod.id,
        nome: prod.nome,
        quantidade: quantidadeItem,
        precoUnitario: precoCentavos,
      },
    ]);

    // Reseta quantidade para 1 e foca
    setQuantidadeItem(1);
    if (inputQtdRef.current) inputQtdRef.current.focus();
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, idx) => idx !== index));
  };

  // Concluir Venda
  const handleFinalizar = () => {
    if (itens.length === 0) {
      alert("Adicione pelo menos um bolo à venda!");
      return;
    }

    let valorPagoCentavos = 0;
    if (tipoPagamento === "QUITADO") {
      valorPagoCentavos = totalVendaCentavos;
    } else if (tipoPagamento === "PARCIAL") {
      valorPagoCentavos = Math.round(parseFloat(valorPagoCustom.replace(",", ".")) * 100) || 0;
    }

    startTransition(async () => {
      const res = await criarVendaRapidaAction({
        clienteId,
        data: dataVenda,
        observacoes,
        dataPrevistaPgto: tipoPagamento !== "QUITADO" ? dataPrevistaPgto : undefined,
        itens: itens.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
        })),
        pagamento: valorPagoCentavos > 0 ? {
          valor: valorPagoCentavos,
          forma: formaPagamento,
        } : undefined,
      });

      if (res?.sucesso) {
        router.push("/vendas");
      } else {
        alert(res?.erro || "Erro ao salvar a venda.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. SELEÇÃO DO CLIENTE & DATA */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-700 uppercase">
                Cliente / Destino
              </label>
              {isClienteDiferenciado ? (
                <span className="text-[11px] font-bold text-stone-900 bg-stone-200 px-2 py-0.5 rounded-full">
                  ★ Cliente com Preço Diferenciado (Revenda/PJ)
                </span>
              ) : (
                <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                  Preço Padrão (Varejo/Consumidor)
                </span>
              )}
            </div>
            <select
              value={clienteId}
              onChange={(e) => handleClienteChange(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 rounded-xl text-base font-semibold text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none bg-stone-50"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.isPadrao ? "(Padrão / Avulso)" : ""} {c.tipo === "REVENDEDOR" ? "— [Diferenciado]" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              Data da Venda
            </label>
            <input
              type="date"
              value={dataVenda}
              onChange={(e) => setDataVenda(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. ADICIONAR PRODUTOS (TECLADO RÁPIDO) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
            Adicionar Bolos à Venda
          </h2>
          {/* Seletor rápido de preço para o produto selecionado */}
          {(() => {
            const prodAtual = produtos.find((p) => p.id === produtoSelecionadoId);
            if (!prodAtual) return null;
            const p1 = (prodAtual.precoVenda / 100).toFixed(2);
            const p2 = ((prodAtual.precoSecundario || prodAtual.precoVenda) / 100).toFixed(2);
            const isP1 = precoItemPersonalizado === p1;
            const isP2 = precoItemPersonalizado === p2 && p1 !== p2;

            return (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-stone-500 font-medium">Preço rápido:</span>
                <button
                  type="button"
                  onClick={() => setPrecoItemPersonalizado(p1)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition border ${
                    isP1
                      ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                      : "bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200"
                  }`}
                  title="Aplicar Preço Padrão"
                >
                  Padrão: {formatarCentavosParaReal(prodAtual.precoVenda)}
                </button>
                <button
                  type="button"
                  onClick={() => setPrecoItemPersonalizado(p2)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition border ${
                    isP2
                      ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                      : "bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200"
                  }`}
                  title="Aplicar Preço Diferenciado"
                >
                  Diferenciado: {formatarCentavosParaReal(prodAtual.precoSecundario || prodAtual.precoVenda)}
                </button>
              </div>
            );
          })()}
        </div>

        <form onSubmit={adicionarItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-stone-600 mb-1">Produto</label>
            <select
              value={produtoSelecionadoId}
              onChange={(e) => handleProdutoChange(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-xl text-sm font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none"
            >
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {formatarCentavosParaReal(p.precoVenda)} / {formatarCentavosParaReal(p.precoSecundario || p.precoVenda)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-600 mb-1">Qtd</label>
            <input
              ref={inputQtdRef}
              type="number"
              min="1"
              value={quantidadeItem}
              onChange={(e) => setQuantidadeItem(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2.5 border rounded-xl text-sm font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-stone-600 mb-1">Preço Unitário (R$)</label>
            <input
              type="text"
              value={precoItemPersonalizado}
              onChange={(e) => setPrecoItemPersonalizado(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-xl text-sm font-bold text-stone-900 bg-stone-50 focus:ring-2 focus:ring-stone-900 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1 transition"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </form>

        {/* Cesta de Itens Lançados */}
        {itens.length > 0 ? (
          <div className="mt-6 border rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b text-xs font-bold text-stone-500">
                <tr>
                  <th className="p-3">Bolo / Produto</th>
                  <th className="p-3 text-center">Qtd</th>
                  <th className="p-3 text-right">Preço Un.</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-center">Remover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {itens.map((item, idx) => (
                  <tr key={idx} className="hover:bg-stone-50">
                    <td className="p-3 font-semibold text-stone-900">{item.nome}</td>
                    <td className="p-3 text-center font-bold text-stone-800">{item.quantidade}</td>
                    <td className="p-3 text-right text-stone-700">
                      {formatarCentavosParaReal(item.precoUnitario)}
                    </td>
                    <td className="p-3 text-right font-black text-stone-900">
                      {formatarCentavosParaReal(item.quantidade * item.precoUnitario)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => removerItem(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-stone-100 font-bold text-stone-900 border-t">
                <tr>
                  <td colSpan={3} className="p-4 text-right uppercase text-xs tracking-wider">
                    Total da Venda:
                  </td>
                  <td className="p-4 text-right text-xl font-black text-stone-900">
                    {formatarCentavosParaReal(totalVendaCentavos)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="mt-6 p-6 border-2 border-dashed border-stone-200 rounded-xl text-center text-stone-600 text-sm">
            Nenhum bolo adicionado ainda. Escolha o bolo acima e aperte "Adicionar" ou Enter.
          </div>
        )}
      </div>

      {/* 3. PAGAMENTO & CONCLUSÃO */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
        <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
          Condição de Pagamento
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTipoPagamento("QUITADO")}
            className={`p-4 rounded-xl border text-center font-bold transition ${
              tipoPagamento === "QUITADO"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                : "bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200"
            }`}
          >
            ✓ Pago Agora (À Vista)
          </button>

          <button
            type="button"
            onClick={() => setTipoPagamento("FIADO")}
            className={`p-4 rounded-xl border text-center font-bold transition ${
              tipoPagamento === "FIADO"
                ? "bg-rose-600 text-white border-rose-600 shadow-md"
                : "bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200"
            }`}
          >
            ⏳ Fiado (Pagar Depois)
          </button>

          <button
            type="button"
            onClick={() => setTipoPagamento("PARCIAL")}
            className={`p-4 rounded-xl border text-center font-bold transition ${
              tipoPagamento === "PARCIAL"
                ? "bg-stone-900 text-white border-stone-900 shadow-md"
                : "bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200"
            }`}
          >
            💵 Pagamento Parcial
          </button>
        </div>

        {/* Detalhes do Pagamento */}
        {tipoPagamento !== "FIADO" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Forma de Pagamento</label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg bg-white text-sm font-semibold"
              >
                <option value="PIX">Pix</option>
                <option value="DINHEIRO">Dinheiro em Espécie</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              </select>
            </div>

            {tipoPagamento === "PARCIAL" && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Valor Pago Agora (R$)</label>
                <input
                  type="text"
                  placeholder="Ex: 20,00"
                  value={valorPagoCustom}
                  onChange={(e) => setValorPagoCustom(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-sm font-bold text-stone-900"
                />
              </div>
            )}
          </div>
        )}

        {tipoPagamento !== "QUITADO" && (
          <div className="p-4 bg-stone-100 rounded-xl border border-stone-200">
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Data Prevista de Pagamento (Opcional)
            </label>
            <input
              type="date"
              value={dataPrevistaPgto}
              onChange={(e) => setDataPrevistaPgto(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-sm text-stone-900"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1">Observações da Venda</label>
          <input
            type="text"
            placeholder="Ex: Entregar antes das 10h, embalagem especial..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm text-stone-900"
          />
        </div>

        {/* Botão de Finalização Principal */}
        <button
          type="button"
          disabled={isPending || itens.length === 0}
          onClick={handleFinalizar}
          className="w-full bg-stone-900 hover:bg-black text-white font-black py-4 px-6 rounded-2xl shadow-lg transition text-lg flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <CheckCircle2 className="w-6 h-6" />
          {isPending ? "Registrando Venda..." : `Concluir Venda (${formatarCentavosParaReal(totalVendaCentavos)})`}
        </button>
      </div>
    </div>
  );
}
