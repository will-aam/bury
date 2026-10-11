export interface ItemCalculo {
  quantidade: number;
  precoUnitario: number; // centavos
}

export interface PagamentoCalculo {
  valor: number; // centavos
}

export function calcularTotalVenda(itens: ItemCalculo[]): number {
  return itens.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0);
}

export function calcularSaldoVenda(totalVenda: number, pagamentos: PagamentoCalculo[]): number {
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const saldo = totalVenda - totalPago;
  return saldo < 0 ? 0 : saldo;
}

export function determinarStatusVenda(
  totalVenda: number,
  pagamentos: PagamentoCalculo[]
): "PENDENTE" | "PARCIAL" | "PAGO" {
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  if (totalPago <= 0) return "PENDENTE";
  if (totalPago < totalVenda) return "PARCIAL";
  return "PAGO";
}

export function calcularMargemLucro(
  precoVendaCentavos: number,
  custoCentavos: number
): { lucroBruto: number; margemPercentual: number } {
  const lucroBruto = precoVendaCentavos - custoCentavos;
  if (precoVendaCentavos <= 0) {
    return { lucroBruto, margemPercentual: 0 };
  }
  const margemPercentual = Math.round((lucroBruto / precoVendaCentavos) * 100);
  return { lucroBruto, margemPercentual };
}

export interface ParcelaCalculada {
  numero: number;
  vencimento: Date;
  valor: number;
}

export function calcularParcelas(
  valorTotalCentavos: number,
  numParcelas: number,
  primeiroVencimento: Date
): ParcelaCalculada[] {
  if (numParcelas <= 0) return [];
  const valorBase = Math.floor(valorTotalCentavos / numParcelas);
  const sobra = valorTotalCentavos - valorBase * numParcelas;

  const parcelas: ParcelaCalculada[] = [];

  for (let i = 1; i <= numParcelas; i++) {
    const dataVenc = new Date(primeiroVencimento);
    dataVenc.setMonth(dataVenc.getMonth() + (i - 1));

    parcelas.push({
      numero: i,
      vencimento: dataVenc,
      valor: i === 1 ? valorBase + sobra : valorBase,
    });
  }

  return parcelas;
}

export interface VendaEmAberto {
  id: string;
  saldoDevedor: number;
}

export interface QuitacaoVenda {
  vendaId: string;
  valorAbatido: number;
  novoSaldo: number;
}

export function abaterFiadosCascata(
  vendas: VendaEmAberto[],
  valorDisponivelCentavos: number
): QuitacaoVenda[] {
  let montante = valorDisponivelCentavos;
  const resultado: QuitacaoVenda[] = [];

  for (const venda of vendas) {
    if (montante <= 0) {
      resultado.push({
        vendaId: venda.id,
        valorAbatido: 0,
        novoSaldo: venda.saldoDevedor,
      });
      continue;
    }

    const abatimento = Math.min(venda.saldoDevedor, montante);
    montante -= abatimento;
    resultado.push({
      vendaId: venda.id,
      valorAbatido: abatimento,
      novoSaldo: venda.saldoDevedor - abatimento,
    });
  }

  return resultado;
}
