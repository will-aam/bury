import { prisma } from "@/lib/prisma";
import { formatarCentavosParaReal } from "@/lib/formatadores";
import ListaDespesasClient from "./ListaDespesasClient";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface DespesasPageProps {
  searchParams?: Promise<{
    pagina?: string;
    busca?: string;
    status?: string;
    categoria?: string;
  }>;
}

export default async function DespesasPage(props: DespesasPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const paginaAtual = Math.max(1, parseInt(searchParams.pagina || "1", 10) || 1);
  const itensPorPagina = 10;
  const busca = searchParams.busca?.trim() || "";
  const status = searchParams.status || "todos";
  const categoria = searchParams.categoria || "todas";

  // Construção do filtro otimizado (WhereInput) para o banco de dados
  const where: Prisma.DespesaWhereInput = {};

  if (busca) {
    where.descricao = {
      contains: busca,
      mode: "insensitive",
    };
  }

  if (status === "PAGO" || status === "PENDENTE") {
    where.status = status;
  }

  if (categoria && categoria !== "todas") {
    where.categoriaId = categoria;
  }

  // Execução paralela e otimizada:
  // 1. Total agregado de despesas cadastradas
  // 2. Total de itens com o filtro atual (para paginação)
  // 3. Despesas da página solicitada (com take e skip)
  // 4. Lista de categorias ativas
  // 5. Lista de ingredientes ativos para vincular às compras
  const [agregadoTotal, totalItens, despesas, categorias, ingredientes] = await Promise.all([
    prisma.despesa.aggregate({
      _sum: { valor: true },
    }),
    prisma.despesa.count({ where }),
    prisma.despesa.findMany({
      where,
      orderBy: { data: "desc" },
      skip: (paginaAtual - 1) * itensPorPagina,
      take: itensPorPagina,
      include: {
        categoria: {
          select: { id: true, nome: true },
        },
        ingrediente: {
          select: { id: true, nome: true, unidadeBase: true },
        },
      },
    }),
    prisma.categoriaDespesa.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.ingrediente.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      include: {
        historicoPrecos: {
          orderBy: { dataRegistro: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  const totalGeralLancado = agregadoTotal._sum.valor || 0;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Despesas e Gastos Operacionais
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Controle de supermercado, insumos, embalagens, transporte, gás e manutenção
          </p>
        </div>

        <div className="bg-white px-4 sm:px-5 py-3 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between sm:block text-left sm:text-right">
          <span className="text-[11px] font-bold text-stone-500 uppercase block">Total Geral Lançado</span>
          <span className="text-xl sm:text-2xl font-black text-rose-700">
            {formatarCentavosParaReal(totalGeralLancado)}
          </span>
        </div>
      </div>

      {/* Componente Client com Formulários, Tabela, Modal de Edição e Paginação */}
      <ListaDespesasClient
        despesas={despesas}
        categorias={categorias}
        totalItens={totalItens}
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        itensPorPagina={itensPorPagina}
        buscaInicial={busca}
        statusInicial={status}
        categoriaInicial={categoria}
        ingredientes={ingredientes as any}
      />
    </div>
  );
}
