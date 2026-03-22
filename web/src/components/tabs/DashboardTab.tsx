import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Categoria, Pedido } from '@shared/types';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../../lib/api';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
);

type DashboardState = {
  orders: Pedido[];
  usersCount: number;
  productsCount: number;
};

type TimelineRange = '24H' | '7D' | '30D';
type ProductTypeFilter = 'TODOS' | Categoria | 'APAGADO';

type ProductRankingItem = {
  name: string;
  quantity: number;
  category: ProductTypeFilter;
};

const PRODUCT_TYPE_OPTIONS: Array<{ value: ProductTypeFilter; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PRATO_PRINCIPAL', label: 'Prato principal' },
  { value: 'ACOMPANHAMENTOS', label: 'Acompanhamentos' },
  { value: 'BEBIDAS', label: 'Bebidas' },
  { value: 'SOBREMESA', label: 'Sobremesa' },
  { value: 'OUTROS', label: 'Outros' },
  { value: 'APAGADO', label: 'Produto apagado' },
];

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const ORANGE = '#f97316';

function normalizeDate(input: string | undefined): Date {
  if (!input) return new Date();

  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const asTimestamp = Number(input);
  if (!Number.isNaN(asTimestamp)) {
    const fromTimestamp = new Date(asTimestamp);
    if (!Number.isNaN(fromTimestamp.getTime())) {
      return fromTimestamp;
    }
  }

  return new Date();
}

function dayKey(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function hourKey(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DashboardTab() {
  const [data, setData] = useState<DashboardState>({ orders: [], usersCount: 0, productsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timelineRange, setTimelineRange] = useState<TimelineRange>('7D');
  const [productTypeFilter, setProductTypeFilter] = useState<ProductTypeFilter>('TODOS');

  const fetchDashboard = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      if (!isBackground) setError(null);

      const [ordersRes, usersRes, productsRes] = await Promise.all([
        api.orders.getAll(),
        api.users.getAll().catch(() => ({ users: [] })),
        api.products.getAll().catch(() => ({ products: [] })),
      ]);

      const allOrders = [
        ...(ordersRes.pendentes || []),
        ...(ordersRes.completos || []),
        ...(ordersRes.cancelados || []),
        ...(ordersRes.arquivados || []),
      ];

      const uniqueOrders = Array.from(new Map(allOrders.map((order) => [order.id, order])).values());

      setData({
        orders: uniqueOrders,
        usersCount: usersRes.users?.length || 0,
        productsCount: productsRes.products?.length || 0,
      });
      setLastUpdated(new Date());
    } catch (err) {
      if (!isBackground) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (autoRefresh) {
      interval = setInterval(() => {
        fetchDashboard(true);
      }, 15000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchDashboard]);

  const summary = useMemo(() => {
    const totalOrders = data.orders.length;
    const totalRevenue = data.orders
      .filter((order) => order.status !== 'CANCELADO')
      .reduce((acc, order) => acc + (order.preco_total || 0), 0);
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusCount = {
      PENDENTE: 0,
      COMPLETO: 0,
      CANCELADO: 0,
      ARQUIVADO: 0,
    };

    const byProduct = new Map<string, ProductRankingItem>();

    for (const order of data.orders) {
      statusCount[order.status] += 1;

      for (const item of order.produtos || []) {
        const productName = (item as { produto?: { nome?: string } }).produto?.nome?.trim();
        const name = productName || 'Produto apagado';
        const category = productName
          ? ((item as { produto?: { categoria?: Categoria } }).produto?.categoria || 'OUTROS')
          : 'APAGADO';
        const mapKey = `${category}::${name}`;
        const current = byProduct.get(mapKey);

        if (!current) {
          byProduct.set(mapKey, {
            name,
            category,
            quantity: item.quantidade || 0,
          });
        } else {
          current.quantity += item.quantidade || 0;
          byProduct.set(mapKey, current);
        }
      }
    }

    const rankingByType = Array.from(byProduct.values()).sort((a, b) => b.quantity - a.quantity);

    return {
      totalOrders,
      totalRevenue,
      avgTicket,
      statusCount,
      rankingByType,
    };
  }, [data.orders]);

  const filteredTopProducts = useMemo(() => {
    const filtered = productTypeFilter === 'TODOS'
      ? summary.rankingByType
      : summary.rankingByType.filter((item) => item.category === productTypeFilter);

    return filtered.slice(0, 7);
  }, [summary.rankingByType, productTypeFilter]);

  const timeline = useMemo(() => {
    const now = new Date();

    if (timelineRange === '24H') {
      const labels: string[] = [];
      const valuesMap = new Map<string, number>();

      for (let i = 23; i >= 0; i -= 1) {
        const bucket = new Date(now);
        bucket.setMinutes(0, 0, 0);
        bucket.setHours(bucket.getHours() - i);
        const label = hourKey(bucket);
        labels.push(label);
        valuesMap.set(label, 0);
      }

      for (const order of data.orders) {
        const createdAt = normalizeDate(order.criado_em);
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        if (diffHours <= 24) {
          const roundedHour = new Date(createdAt);
          roundedHour.setMinutes(0, 0, 0);
          const label = hourKey(roundedHour);
          if (valuesMap.has(label)) {
            valuesMap.set(label, (valuesMap.get(label) || 0) + 1);
          }
        }
      }

      return {
        labels,
        values: labels.map((label) => valuesMap.get(label) || 0),
      };
    }

    const daysToRender = timelineRange === '30D' ? 30 : 7;
    const labels: string[] = [];
    const valuesMap = new Map<string, number>();

    for (let i = daysToRender - 1; i >= 0; i -= 1) {
      const bucket = new Date(now);
      bucket.setDate(bucket.getDate() - i);
      const label = dayKey(bucket);
      labels.push(label);
      valuesMap.set(label, 0);
    }

    for (const order of data.orders) {
      const createdAt = normalizeDate(order.criado_em);
      const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= daysToRender) {
        const label = dayKey(createdAt);
        if (valuesMap.has(label)) {
          valuesMap.set(label, (valuesMap.get(label) || 0) + 1);
        }
      }
    }

    return {
      labels,
      values: labels.map((label) => valuesMap.get(label) || 0),
    };
  }, [data.orders, timelineRange]);

  const statusChartData = {
    labels: ['Pendentes', 'Completos', 'Cancelados', 'Arquivados'],
    datasets: [
      {
        data: [
          summary.statusCount.PENDENTE,
          summary.statusCount.COMPLETO,
          summary.statusCount.CANCELADO,
          summary.statusCount.ARQUIVADO,
        ],
        backgroundColor: ['#fb923c', '#22c55e', '#ef4444', '#60a5fa'],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const topProductsData = {
    labels: filteredTopProducts.map((item) => item.name),
    datasets: [
      {
        label: 'Qtd. vendida',
        data: filteredTopProducts.map((item) => item.quantity),
        backgroundColor: [
          '#f97316',
          '#fb923c',
          '#fdba74',
          '#fed7aa',
          '#facc15',
          '#86efac',
          '#93c5fd',
        ],
        borderRadius: 10,
      },
    ],
  };

  const ordersPerDayData = {
    labels: timeline.labels,
    datasets: [
      {
        label: 'Pedidos por dia',
        data: timeline.values,
        borderColor: ORANGE,
        backgroundColor: 'rgba(249, 115, 22, 0.18)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: ORANGE,
        pointBorderWidth: 2,
      },
    ],
  };

  const sharedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#374151',
          font: {
            family: 'ui-sans-serif, system-ui, sans-serif',
            size: 12,
            weight: 600,
          },
        },
      },
    },
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Dashboard</h2>
          <p className="text-xs text-gray-500">
            {lastUpdated ? `Última atualização: ${lastUpdated.toLocaleTimeString('pt-BR')}` : 'Aguardando dados...'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-500 border-gray-300 w-4 h-4 cursor-pointer"
            />
            Atualização automática
          </label>

          <button
            onClick={() => fetchDashboard(false)}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:scale-95 transition-all"
          >
            Atualizar
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-8 bg-gradient-to-b from-orange-50/35 via-gray-50 to-gray-100">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 w-fit">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Pedidos totais</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{summary.totalOrders}</p>
              </div>

              <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Faturamento</p>
                <p className="text-3xl font-black text-orange-600 mt-2">{currency.format(summary.totalRevenue)}</p>
              </div>

              <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Ticket médio</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{currency.format(summary.avgTicket)}</p>
              </div>

              <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Base ativa</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{data.usersCount} usuários</p>
                <p className="text-xs text-gray-500 mt-1">{data.productsCount} produtos no cardápio</p>
              </div>
            </section>

            <section className="grid grid-cols-1 2xl:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm 2xl:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800">Distribuição por status</h3>
                  <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                    Operação
                  </span>
                </div>
                <div className="h-72">
                  <Doughnut data={statusChartData} options={sharedOptions} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm 2xl:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800">Pedidos por período</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTimelineRange('24H')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        timelineRange === '24H'
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-orange-200 hover:text-orange-600'
                      }`}
                    >
                      Últimas 24h
                    </button>
                    <button
                      onClick={() => setTimelineRange('7D')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        timelineRange === '7D'
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-orange-200 hover:text-orange-600'
                      }`}
                    >
                      Últimos 7 dias
                    </button>
                    <button
                      onClick={() => setTimelineRange('30D')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        timelineRange === '30D'
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-orange-200 hover:text-orange-600'
                      }`}
                    >
                      Últimos 30 dias
                    </button>
                  </div>
                </div>
                <div className="h-72">
                  <Line
                    data={ordersPerDayData}
                    options={{
                      ...sharedOptions,
                      plugins: {
                        ...sharedOptions.plugins,
                        legend: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { color: '#6b7280', precision: 0 },
                          grid: { color: '#f1f5f9' },
                        },
                        x: {
                          ticks: { color: '#6b7280' },
                          grid: { display: false },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 2xl:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm 2xl:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800">Produtos mais pedidos</h3>
                  <span className="text-xs font-semibold text-gray-500">Top 7</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {PRODUCT_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setProductTypeFilter(option.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        productTypeFilter === option.value
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-orange-200 hover:text-orange-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="h-80">
                  {filteredTopProducts.length > 0 ? (
                    <Bar
                      data={topProductsData}
                      options={{
                        ...sharedOptions,
                        indexAxis: 'y' as const,
                        plugins: {
                          ...sharedOptions.plugins,
                          legend: { display: false },
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            ticks: { color: '#6b7280', precision: 0 },
                            grid: { color: '#f1f5f9' },
                          },
                          y: {
                            ticks: { color: '#374151' },
                            grid: { display: false },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500">
                      Sem dados de produtos para o tipo selecionado
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Resumo rápido</h3>
                <div className="space-y-3">
                  {filteredTopProducts.slice(0, 5).map((item, index) => (
                    <div key={`${item.name}-${item.category}-${index}`} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      </div>
                      <span className="text-sm font-black text-gray-700">{item.quantity}x</span>
                    </div>
                  ))}

                  {filteredTopProducts.length === 0 && !loading && (
                    <p className="text-sm text-gray-500">Sem pedidos suficientes para o filtro selecionado.</p>
                  )}

                  {filteredTopProducts.some((item) => item.name === 'Produto apagado') && (
                    <div className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg p-2">
                      Alguns itens estão como Produto apagado por segurança quando o produto original não existe mais.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {loading && (
          <div className="fixed bottom-6 right-6 bg-white border border-orange-100 rounded-xl px-4 py-2 shadow-md text-sm font-medium text-gray-700">
            Carregando dashboard...
          </div>
        )}
      </main>
    </>
  );
}
