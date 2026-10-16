"use client";

interface Produto {
  id: string;
  nome: string;
}

export default function GradeMensalTabela({
  diasNoMes,
  produtos,
  gradeDias,
}: {
  diasNoMes: number;
  produtos: Produto[];
  gradeDias: Record<number, Record<string, number>>;
}) {
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);

  // Totais por produto
  const totaisPorProduto: Record<string, number> = {};
  for (const prod of produtos) {
    let soma = 0;
    for (const dia of dias) {
      soma += gradeDias[dia]?.[prod.id] || 0;
    }
    totaisPorProduto[prod.id] = soma;
  }

  // Totais por dia
  const totaisPorDia: Record<number, number> = {};
  for (const dia of dias) {
    let somaDia = 0;
    for (const prod of produtos) {
      somaDia += gradeDias[dia]?.[prod.id] || 0;
    }
    totaisPorDia[dia] = somaDia;
  }

  const grandeTotal = Object.values(totaisPorProduto).reduce((a, b) => a + b, 0);

  return (
    <div className="overflow-x-auto border rounded-xl">
      <table className="min-w-full text-xs text-left divide-y divide-stone-200">
        <thead className="bg-stone-50 text-stone-600 font-bold sticky top-0">
          <tr>
            <th className="p-3 min-w-[200px] border-r bg-stone-100 sticky left-0 z-10">
              Sabor / Produto
            </th>
            {dias.map((d) => (
              <th key={d} className="p-2 text-center min-w-[36px] font-mono">
                {d}
              </th>
            ))}
            <th className="p-3 text-right bg-stone-900 text-white font-black min-w-[70px]">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 bg-white">
          {produtos.map((prod) => {
            const totalProd = totaisPorProduto[prod.id] || 0;
            return (
              <tr key={prod.id} className="hover:bg-stone-50">
                <td className="p-3 font-semibold text-stone-900 border-r bg-white sticky left-0 z-10">
                  {prod.nome}
                </td>
                {dias.map((d) => {
                  const qtd = gradeDias[d]?.[prod.id] || 0;
                  return (
                    <td
                      key={d}
                      className={`p-2 text-center font-mono ${
                        qtd > 0 ? "font-bold text-stone-900 bg-stone-100/60" : "text-stone-300"
                      }`}
                    >
                      {qtd > 0 ? qtd : "-"}
                    </td>
                  );
                })}
                <td className="p-3 text-right font-black text-stone-900 bg-stone-100">
                  {totalProd}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-stone-100 font-bold border-t-2 border-stone-300">
          <tr>
            <td className="p-3 uppercase text-stone-700 border-r sticky left-0 bg-stone-100 z-10">
              Total Diário:
            </td>
            {dias.map((d) => (
              <td key={d} className="p-2 text-center font-mono font-bold text-stone-900">
                {totaisPorDia[d] || "-"}
              </td>
            ))}
            <td className="p-3 text-right font-black text-base text-white bg-stone-900">
              {grandeTotal}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
