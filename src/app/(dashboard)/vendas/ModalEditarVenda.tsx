"use client";

import { useState, useTransition } from "react";
import { editarVendaAction, excluirVendaAction } from "@/app/actions/vendas";
import { Edit2, Trash2, X, Plus, AlertCircle } from "lucide-react";
import { formatarCentavosParaReal } from "@/lib/formatadores";

interface ClienteOption {
  id: string;
  nome: string;
  tipo?: string;
}

interface ProdutoOption {
  id: string;
  nome: string;
  precoVenda: number;
  precoSecundario?: number;
}

interface ItemVendaData {
  id?: string;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  produto?: {
    nome: string;
  };
}

interface VendaParaEdicao {
  id: string;
  data: string | Date;
  clienteId: string;
  dataPrevistaPgto?: string | Date | null;
  observacoes?: string | null;
  itens: ItemVendaData[];
  pago?: number;
}

export default function ModalEditarVenda({
  venda,
  clientes,
  produtos,
}: {
  venda: VendaParaEdicao;
  clientes: ClienteOption[];
  produtos: ProdutoOption[];
}) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  // Formatar data da venda para YYYY-MM-DD
  const formatarDataInput = (d: string | Date | null | undefined) => {
    if (!d) return "";
    if (d instanceof Date) return d.toISOString().split("T")[0];
    return d.split("T")[0];
  };

  const [clienteId, setClienteId] = useState(venda.clienteId);
  const [data, setData] = useState(formatarDataInput(venda.data));
  const [dataPrevistaPgto, setDataPrevistaPgto] = useState(formatarDataInput(venda.dataPrevistaPgto));
  const [observacoes, setObservacoes] = useState(venda.observacoes || "");

  // Itens
  const [itens, setItens] = useState<
    {
      produtoId: string;
      nome: string;
      quantidade: number;
      precoUnitarioCentavos: number;
    }[]
  >(
    venda.itens.map((i) => {
      const prod = produtos.find((p) => p.id === i.produtoId);
      return {
        produtoId: i.produtoId,
        nome: prod?.nome || i.produto?.nome || "Produto",
        quantidade: i.quantidade,
        precoUnitarioCentavos: i.precoUnitario,
      };
    })
  );

  // Seletor de novo item
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState(produtos[0]?.id || "");
  const [quantidadeItem, setQuantidadeItem] = useState(1);
  const clienteAtual = clientes.find((c) => c.id === clienteId);
  const isClienteDiferenciado = clienteAtual?.tipo === "REVENDEDOR";

  const obterPrecoSugerido = (prodId: string) => {
    const prod = produtos.find((p) => p.id === prodId);
    if (!prod) return "0,00";
    const valorCentavos = isClienteDiferenciado && prod.precoSecundario ? prod.precoSecundario : prod.precoVenda;
    return (valorCentavos / 100).toFixed(2).replace(".", ",");
  };

  const [precoItemInput, setPrecoItemInput] = useState(obterPrecoSugerido(produtos[0]?.id || ""));

  const handleProdutoChange = (novoId: string) => {
    setProdutoSelecionadoId(novoId);
    const prod = produtos.find((p) => p.id === novoId);
    if (prod) {
      const valorCentavos = isClienteDiferenciado && prod.precoSecundario ? prod.precoSecundario : prod.precoVenda;
      setPrecoItemInput((valorCentavos / 100).toFixed(2).replace(".", ","));
    }
  };

  const adicionarItem = () => {
    const prod = produtos.find((p) => p.id === produtoSelecionadoId);
    if (!prod || quantidadeItem <= 0) return;

    const precoCentavos = Math.round(parseFloat(precoItemInput.replace(",", ".")) * 100);
    if (isNaN(precoCentavos) || precoCentavos < 0) return;

    setItens([
      ...itens,
      {
        produtoId: prod.id,
        nome: prod.nome,
        quantidade: quantidadeItem,
        precoUnitarioCentavos: precoCentavos,
      },
    ]);

    setQuantidadeItem(1);
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, idx) => idx !== index));
  };

  const totalCalculadoCentavos = itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitarioCentavos, 0);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (itens.length === 0) {
      setErro("A venda precisa conter pelo menos 1 bolo/item.");
      return;
    }

    startTransition(async () => {
      const res = await editarVendaAction({
        id: venda.id,
        clienteId,
        data,
        dataPrevistaPgto: dataPrevistaPgto || undefined,
        observacoes: observacoes || undefined,
        itens: itens.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitarioCentavos,
        })),
      });

      if (res?.erro) {
        setErro(res.erro);
      } else {
        setAberto(false);
      }
    });
  };

  const handleExcluir = () => {
    if (!confirm("Tem certeza que deseja apagar esta venda? Esta ação não pode ser desfeita.")) {
      return;
    }

    startTransition(async () => {
      const res = await excluirVendaAction(venda.id);
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
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
        title="Editar ou Apagar Venda"
      >
        <Edit2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Editar</span>
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-auto max-h-[92vh] overflow-y-auto">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg">Editar Venda</h3>
                <p className="text-xs text-stone-500">Corrija data, cliente, itens ou observações</p>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleSalvar} className="mt-4 space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Cliente</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-medium text-stone-900 bg-white focus:ring-2 focus:ring-stone-900 outline-none text-sm"
                  required
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.tipo === "REVENDEDOR" ? "(Revendedor)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Datas: Venda e Previsão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Data da Venda</label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Previsão Pgto (opcional)
                  </label>
                  <input
                    type="date"
                    value={dataPrevistaPgto}
                    onChange={(e) => setDataPrevistaPgto(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Observação / Descrição */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Descrição / Observações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Entregue pela manhã, sabor especial..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none text-sm"
                />
              </div>

              {/* Seção de Itens / Bolos */}
              <div className="pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold text-stone-700 uppercase mb-2">Bolos e Itens da Venda</label>

                {/* Lista de Itens atuais */}
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {itens.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900">
                          {it.quantidade}x {it.nome}
                        </span>
                        <span className="block text-stone-500">
                          {formatarCentavosParaReal(it.precoUnitarioCentavos)} un. ={" "}
                          <strong>{formatarCentavosParaReal(it.quantidade * it.precoUnitarioCentavos)}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerItem(idx)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                        title="Remover produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {itens.length === 0 && (
                    <p className="text-xs text-stone-400 italic py-1">Nenhum bolo adicionado.</p>
                  )}
                </div>

                {/* Adicionar novo item */}
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-2">
                  <span className="text-[11px] font-bold text-stone-600 block uppercase">Adicionar outro item</span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <select
                        value={produtoSelecionadoId}
                        onChange={(e) => handleProdutoChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white text-stone-900 font-medium"
                      >
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={quantidadeItem}
                        onChange={(e) => setQuantidadeItem(parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white text-stone-900 font-bold"
                        title="Quantidade"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={precoItemInput}
                        onChange={(e) => setPrecoItemInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white text-stone-900 font-bold"
                        title="Preço Unitário R$"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={adicionarItem}
                        className="w-full h-full py-1.5 bg-stone-900 hover:bg-black text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Incluir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Total da Venda */}
                <div className="flex justify-between items-center mt-3 pt-2 border-t text-sm font-bold text-stone-900">
                  <span>Novo Total da Venda:</span>
                  <span className="text-base font-black text-stone-900">
                    {formatarCentavosParaReal(totalCalculadoCentavos)}
                  </span>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleExcluir}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Apagar Venda
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAberto(false)}
                    disabled={isPending}
                    className="px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-bold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
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
