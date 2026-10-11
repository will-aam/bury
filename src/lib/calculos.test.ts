import { describe, it, expect } from "vitest";
import {
  calcularTotalVenda,
  calcularSaldoVenda,
  determinarStatusVenda,
  calcularMargemLucro,
  calcularParcelas,
  abaterFiadosCascata,
} from "./calculos";

describe("Regras de Cálculo Financeiro da Bolaria", () => {
  it("deve calcular o total de uma venda somando os itens corretamente em centavos", () => {
    const itens = [
      { quantidade: 2, precoUnitario: 2500 }, // 2 * R$ 25,00 = R$ 50,00 (5000 centavos)
      { quantidade: 3, precoUnitario: 1500 }, // 3 * R$ 15,00 = R$ 45,00 (4500 centavos)
    ];
    const total = calcularTotalVenda(itens);
    expect(total).toBe(9500); // R$ 95,00
  });

  it("deve calcular o saldo devedor e status correto de uma venda", () => {
    const totalVenda = 10000; // R$ 100,00

    // Sem pagamento -> Fiado / Pendente
    expect(calcularSaldoVenda(totalVenda, [])).toBe(10000);
    expect(determinarStatusVenda(totalVenda, [])).toBe("PENDENTE");

    // Pagamento parcial (R$ 40,00)
    const pagamentosParciais = [{ valor: 4000 }];
    expect(calcularSaldoVenda(totalVenda, pagamentosParciais)).toBe(6000);
    expect(determinarStatusVenda(totalVenda, pagamentosParciais)).toBe("PARCIAL");

    // Pagamento total (R$ 40,00 + R$ 60,00)
    const pagamentosTotais = [{ valor: 4000 }, { valor: 6000 }];
    expect(calcularSaldoVenda(totalVenda, pagamentosTotais)).toBe(0);
    expect(determinarStatusVenda(totalVenda, pagamentosTotais)).toBe("PAGO");
  });

  it("deve calcular a margem de lucro percentual e bruta", () => {
    const precoVenda = 3000; // R$ 30,00
    const custo = 1200;      // R$ 12,00
    const margem = calcularMargemLucro(precoVenda, custo);

    expect(margem.lucroBruto).toBe(1800); // R$ 18,00
    expect(margem.margemPercentual).toBe(60); // 60%
  });

  it("deve dividir compra parcelada gerando parcelas exatas sem perda de centavos", () => {
    const valorTotal = 100000; // R$ 1.000,00 em 3 parcelas
    const parcelas = calcularParcelas(valorTotal, 3, new Date("2026-05-10"));

    expect(parcelas).toHaveLength(3);
    const soma = parcelas.reduce((acc, p) => acc + p.valor, 0);
    expect(soma).toBe(100000);
    expect(parcelas[0].valor).toBe(33334); // Diferença de arredondamento distribuída na 1ª
    expect(parcelas[1].valor).toBe(33333);
    expect(parcelas[2].valor).toBe(33333);
  });

  it("deve abater pagamentos em cascata das vendas mais antigas primeiro", () => {
    const vendasEmAberto = [
      { id: "v1", saldoDevedor: 3000 }, // R$ 30,00 mais antiga
      { id: "v2", saldoDevedor: 5000 }, // R$ 50,00
      { id: "v3", saldoDevedor: 2000 }, // R$ 20,00
    ];

    const quitacoes = abaterFiadosCascata(vendasEmAberto, 6000); // Cliente pagou R$ 60,00

    expect(quitacoes).toEqual([
      { vendaId: "v1", valorAbatido: 3000, novoSaldo: 0 },
      { vendaId: "v2", valorAbatido: 3000, novoSaldo: 2000 },
      { vendaId: "v3", valorAbatido: 0, novoSaldo: 2000 },
    ]);
  });
});
