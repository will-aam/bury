"use client";

import { useState } from "react";
import { formatarCentavosParaReal, formatarDataPtBr } from "@/lib/formatadores";
import { Download, Printer, Calendar, FileText, X } from "lucide-react";
import jsPDF from "jspdf";

interface ItemVenda {
  id: string;
  quantidade: number;
  precoUnitario: number;
  produto: {
    nome: string;
  };
}

interface Pagamento {
  id: string;
  valor: number;
  forma: string;
  data: string | Date;
}

interface VendaCliente {
  id: string;
  numero: number;
  data: string | Date;
  observacoes?: string | null;
  itens: ItemVenda[];
  pagamentos: Pagamento[];
}

interface ClienteInfo {
  id: string;
  nome: string;
  tipo: string;
  telefone?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
}

export default function ModalExportarHistoricoCliente({
  cliente,
  vendas,
}: {
  cliente: ClienteInfo;
  vendas: VendaCliente[];
}) {
  const [aberto, setAberto] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "mes" | "periodo">("todos");

  // Períodos
  const hoje = new Date();
  const mesAtualStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualStr);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Filtragem de vendas
  const vendasFiltradas = vendas.filter((v) => {
    const dataVenda = new Date(v.data);
    const anoMes = `${dataVenda.getFullYear()}-${String(dataVenda.getMonth() + 1).padStart(2, "0")}`;

    if (tipoFiltro === "mes") {
      return anoMes === mesSelecionado;
    }

    if (tipoFiltro === "periodo") {
      if (dataInicio) {
        const inicio = new Date(`${dataInicio}T00:00:00`);
        if (dataVenda < inicio) return false;
      }
      if (dataFim) {
        const fim = new Date(`${dataFim}T23:59:59`);
        if (dataVenda > fim) return false;
      }
      return true;
    }

    return true; // todos
  });

  // Métricas do filtro
  let totalFiltro = 0;
  let pagoFiltro = 0;
  for (const v of vendasFiltradas) {
    const tot = v.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
    const pag = v.pagamentos.reduce((acc, p) => acc + p.valor, 0);
    totalFiltro += tot;
    pagoFiltro += pag;
  }
  const pendenteFiltro = Math.max(0, totalFiltro - pagoFiltro);

  // Geração do PDF profissional
  const gerarPDF = (acao: "download" | "imprimir") => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = 16;

    // Cabeçalho da Empresa
    doc.setFillColor(217, 119, 6); // amber-600
    doc.rect(margin, y, 4, 16, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text("EXTRATO / HISTÓRICO DE COMPRAS", margin + 7, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const dataEmissao = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());
    doc.text(`Emitido em: ${dataEmissao}`, margin + 7, y + 12);

    y += 22;

    // Box de Informações do Cliente
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 2, 2, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Cliente: ${cliente.nome}`, margin + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    const tipoDesc = cliente.tipo === "REVENDEDOR" ? "Revendedor / Ponto de Venda" : "Consumidor Final";
    doc.text(`Tipo: ${tipoDesc}`, margin + 4, y + 12);
    doc.text(`Telefone: ${cliente.telefone || "Não informado"}`, margin + 4, y + 18);

    const periodoTexto =
      tipoFiltro === "mes"
        ? `Mês de referência: ${mesSelecionado}`
        : tipoFiltro === "periodo"
        ? `Período: ${dataInicio ? formatarDataPtBr(dataInicio) : "Início"} até ${
            dataFim ? formatarDataPtBr(dataFim) : "Hoje"
          }`
        : "Período: Todo o histórico";

    doc.text(periodoTexto, pageWidth - margin - 4, y + 6, { align: "right" });
    doc.text(`Endereço: ${cliente.endereco || "Não informado"}`, pageWidth - margin - 4, y + 12, {
      align: "right",
    });

    y += 30;

    // Resumo Financeiro (Cards em linha)
    const cardWidth = (pageWidth - margin * 2 - 8) / 3;

    // Card 1: Total
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, cardWidth, 16, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL COMPRADO", margin + 4, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(formatarCentavosParaReal(totalFiltro), margin + 4, y + 12);

    // Card 2: Pago
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin + cardWidth + 4, y, cardWidth, 16, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52);
    doc.text("TOTAL PAGO", margin + cardWidth + 8, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(21, 128, 61);
    doc.text(formatarCentavosParaReal(pagoFiltro), margin + cardWidth + 8, y + 12);

    // Card 3: Saldo
    const corBg = pendenteFiltro > 0 ? [254, 242, 242] : [248, 250, 252];
    doc.setFillColor(corBg[0], corBg[1], corBg[2]);
    doc.roundedRect(margin + (cardWidth + 4) * 2, y, cardWidth, 16, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(pendenteFiltro > 0 ? 153 : 100, pendenteFiltro > 0 ? 27 : 116, pendenteFiltro > 0 ? 27 : 139);
    doc.text("SALDO DEVEDOR / PENDENTE", margin + (cardWidth + 4) * 2 + 4, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(pendenteFiltro > 0 ? 185 : 15, pendenteFiltro > 0 ? 28 : 23, pendenteFiltro > 0 ? 28 : 42);
    doc.text(formatarCentavosParaReal(pendenteFiltro), margin + (cardWidth + 4) * 2 + 4, y + 12);

    y += 22;

    // Tabela de Pedidos
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Relação de Compras (${vendasFiltradas.length} pedidos)`, margin, y);

    y += 4;

    // Cabeçalho da Tabela
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    doc.text("DATA", margin + 3, y + 5);
    doc.text("ITENS / PRODUTOS", margin + 28, y + 5);
    doc.text("TOTAL", pageWidth - margin - 52, y + 5, { align: "right" });
    doc.text("PAGO", pageWidth - margin - 28, y + 5, { align: "right" });
    doc.text("SALDO", pageWidth - margin - 3, y + 5, { align: "right" });

    y += 7;

    // Linhas da Tabela
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    if (vendasFiltradas.length === 0) {
      doc.setTextColor(148, 163, 184);
      doc.text("Nenhuma compra encontrada para o período selecionado.", margin + 3, y + 8);
    } else {
      vendasFiltradas.forEach((v, index) => {
        const totalVenda = v.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
        const pagoVenda = v.pagamentos.reduce((acc, p) => acc + p.valor, 0);
        const saldoVenda = Math.max(0, totalVenda - pagoVenda);

        const descItens = v.itens.map((i) => `${i.quantidade}x ${i.produto.nome}`).join(", ");
        const itensQuebrados = doc.splitTextToSize(descItens, 85);
        const linhaAltura = Math.max(8, itensQuebrados.length * 3.8 + 4);

        // Quebra de página automática
        if (y + linhaAltura > pageHeight - 16) {
          doc.addPage();
          y = 16;
          // Redesenha cabeçalho
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text("DATA", margin + 3, y + 5);
          doc.text("ITENS / PRODUTOS", margin + 28, y + 5);
          doc.text("TOTAL", pageWidth - margin - 52, y + 5, { align: "right" });
          doc.text("PAGO", pageWidth - margin - 28, y + 5, { align: "right" });
          doc.text("SALDO", pageWidth - margin - 3, y + 5, { align: "right" });
          y += 7;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
        }

        // Fundo zebrado
        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y, pageWidth - margin * 2, linhaAltura, "F");
        }

        doc.setTextColor(30, 41, 59);
        doc.text(formatarDataPtBr(v.data), margin + 3, y + 4.5);
        doc.text(itensQuebrados, margin + 28, y + 4.5);

        doc.setFont("helvetica", "bold");
        doc.text(formatarCentavosParaReal(totalVenda), pageWidth - margin - 52, y + 4.5, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setTextColor(21, 128, 61);
        doc.text(formatarCentavosParaReal(pagoVenda), pageWidth - margin - 28, y + 4.5, { align: "right" });

        if (saldoVenda > 0) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(185, 28, 28);
          doc.text(formatarCentavosParaReal(saldoVenda), pageWidth - margin - 3, y + 4.5, { align: "right" });
        } else {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text("Quitado", pageWidth - margin - 3, y + 4.5, { align: "right" });
        }

        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y + linhaAltura, pageWidth - margin, y + linhaAltura);

        y += linhaAltura;
      });
    }

    const nomeArquivo = `historico_${cliente.nome.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`;

    if (acao === "imprimir") {
      doc.autoPrint();
      const blobUrl = doc.output("bloburl");
      window.open(blobUrl, "_blank");
    } else {
      doc.save(nomeArquivo);
    }
  };

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold px-4 py-2.5 rounded-xl text-sm shadow-xs transition w-full sm:w-auto"
      >
        <Printer className="w-4 h-4 text-amber-600" />
        Imprimir / Exportar Histórico (PDF)
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho Modal */}
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Exportar Histórico de Compras
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">Cliente: {cliente.nome}</p>
              </div>
              <button
                onClick={() => setAberto(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Seleção do Período */}
            <div className="my-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-2">
                  Selecione o Período
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoFiltro("todos")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      tipoFiltro === "todos"
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Todo o Histórico
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoFiltro("mes")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      tipoFiltro === "mes"
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Mês Específico
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoFiltro("periodo")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      tipoFiltro === "periodo"
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Vários Meses / De - Até
                  </button>
                </div>
              </div>

              {/* Opção Mês Específico */}
              {tipoFiltro === "mes" && (
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                  <label className="block text-xs font-bold text-stone-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Escolha o mês
                  </label>
                  <input
                    type="month"
                    value={mesSelecionado}
                    onChange={(e) => setMesSelecionado(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm font-semibold text-stone-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Opção Faixa de Datas / Vários Meses */}
              {tipoFiltro === "periodo" && (
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">Data Início</label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">Data Fim</label>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Prévia do que vai sair no relatório */}
              <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl space-y-1.5 text-xs text-amber-950">
                <div className="flex justify-between font-medium">
                  <span>Compras selecionadas:</span>
                  <span className="font-bold">{vendasFiltradas.length} pedidos</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Valor total do período:</span>
                  <span className="font-bold">{formatarCentavosParaReal(totalFiltro)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total já quitado:</span>
                  <span className="font-bold text-emerald-700">{formatarCentavosParaReal(pagoFiltro)}</span>
                </div>
                {pendenteFiltro > 0 && (
                  <div className="flex justify-between font-bold text-rose-700 pt-1 border-t border-amber-200/60">
                    <span>Saldo pendente no período:</span>
                    <span>{formatarCentavosParaReal(pendenteFiltro)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Cancelar
              </button>
              <div className="flex-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => gerarPDF("imprimir")}
                  className="flex-1 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4 text-stone-600" />
                  Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => gerarPDF("download")}
                  className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
