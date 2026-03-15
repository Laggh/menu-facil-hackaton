import { useState, useEffect, useCallback } from 'react';
import type { Produto, Categoria } from '@shared/types';
import api from './lib/api';
import { ProductModal } from './components/ProductModal';

const CATEGORIA_LABELS: Record<Categoria, string> = {
  PRATO_PRINCIPAL: 'Prato Principal',
  ACOMPANHAMENTOS: 'Acompanhamentos',
  BEBIDAS: 'Bebidas',
  SOBREMESA: 'Sobremesa',
  OUTROS: 'Outros',
};

const CATEGORIA_COLORS: Record<Categoria, string> = {
  PRATO_PRINCIPAL: 'bg-orange-100 text-orange-800 border border-orange-200',
  ACOMPANHAMENTOS: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  BEBIDAS: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
  SOBREMESA: 'bg-pink-100 text-pink-800 border border-pink-200',
  OUTROS: 'bg-gray-100 text-gray-800 border border-gray-200',
};

const ALL_CATEGORIAS = Object.keys(CATEGORIA_LABELS) as Categoria[];

type Tab = 'DASHBOARD' | 'CARDAPIO' | 'PEDIDOS' | 'LOGS';

type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error';
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('CARDAPIO');
  const [products, setProducts] = useState<Produto[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Categoria | 'ALL'>('ALL');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { products } = await api.products.getAll();
      setProducts(products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      setError(null);
      const { logs } = await api.logs.getAll();
      setLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar logs');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'CARDAPIO') {
      loadProducts();
    } else if (activeTab === 'LOGS') {
      loadLogs();
    }
  }, [activeTab, loadProducts, loadLogs]);

  const handleCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product: Produto) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Deseja realmente excluir este produto?')) return;
    setDeletingId(id);
    try {
      await api.products.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Produto excluído com sucesso!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir produto', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (data: Omit<Produto, 'id'>) => {
    try {
      if (editingProduct) {
        const { product } = await api.products.update(editingProduct.id, data);
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? product : p)));
        showToast('Produto atualizado com sucesso!', 'success');
      } else {
        const { product } = await api.products.create(data);
        setProducts((prev) => [...prev, product]);
        showToast('Produto criado com sucesso!', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar produto.', 'error');
      throw err; // throw para o modal não fechar se der erro 
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'ALL' || p.categoria === categoryFilter;
    return matchSearch && matchCategory;
  });

  const categoryCounts = products.reduce(
    (acc, p) => ({ ...acc, [p.categoria]: (acc[p.categoria] ?? 0) + 1 }),
    {} as Partial<Record<Categoria, number>>,
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm select-none">
              M
            </div>
            <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">Menu Fácil</h1>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Gestão</p>

          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'DASHBOARD' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('PEDIDOS')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'PEDIDOS' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Pedidos
          </button>

          <button
            onClick={() => setActiveTab('CARDAPIO')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'CARDAPIO' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Cardápio
          </button>

          <p className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-3">Sistema</p>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'LOGS' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Logs da IA (Gemini)
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">A</div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
              <p className="text-xs text-gray-500 truncate">admin@menufacil.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {activeTab === 'DASHBOARD' && 'Dashboard'}
              {activeTab === 'PEDIDOS' && 'Fila de Pedidos'}
              {activeTab === 'CARDAPIO' && 'Gerenciamento de Cardápio'}
              {activeTab === 'LOGS' && 'Logs de Integração da IA'}
            </h2>
          </div>
          {activeTab === 'CARDAPIO' && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <span className="text-lg leading-none">+</span> Novo Produto
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          {activeTab === 'DASHBOARD' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">📊</div>
              <p className="font-medium">Dashboard em construção</p>
              <p className="text-sm text-gray-500">Estatísticas de vendas e acessos aparecerão aqui.</p>
            </div>
          )}

          {activeTab === 'PEDIDOS' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">📦</div>
              <p className="font-medium">Sistema de pedidos em construção</p>
              <p className="text-sm text-gray-500">Módulo a ser implementado em breve.</p>
            </div>
          )}

          {activeTab === 'CARDAPIO' && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <p className="text-sm font-medium text-gray-500 relative z-10">Total</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2 relative z-10">{products.length}</p>
          </div>
          {ALL_CATEGORIAS.map((cat) => (
            <div key={cat} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <p className="text-sm font-medium text-gray-500 truncate relative z-10">{CATEGORIA_LABELS[cat]}</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-2 relative z-10">{categoryCounts[cat] ?? 0}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto por nome ou descrição..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-shadow"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Categoria | 'ALL')}
            className="sm:w-64 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="ALL">Todas as categorias</option>
            {ALL_CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>{CATEGORIA_LABELS[cat]}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400 gap-4">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Carregando cardápio...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium">{error}</p>
              <button
                onClick={loadProducts}
                className="text-sm px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Produto</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Categoria</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Preço</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4 hidden lg:table-cell">Restrições</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-24">
                        <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p className="text-base font-medium text-gray-600">Nenhum produto encontrado</p>
                          <p className="text-sm">Tente ajustar seus filtros ou realizar uma nova busca.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/80 transition-colors group">
                        {/* Produto */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {product.imagem_url ? (
                              <img
                                src={product.imagem_url}
                                alt={product.nome}
                                className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                                🍽️
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">{product.nome}</p>
                              <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px] sm:max-w-xs">{product.descricao || <span className="italic">Sem descrição</span>}</p>
                            </div>
                          </div>
                        </td>

                        {/* Categoria */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${CATEGORIA_COLORS[product.categoria]}`}>
                            {CATEGORIA_LABELS[product.categoria]}
                          </span>
                        </td>

                        {/* Preço */}
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900 px-3 py-1 bg-gray-100 rounded-lg text-sm">
                            {product.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </td>

                        {/* Restrições */}
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1.5">
                            {product.restricoes.length === 0 ? (
                              <span className="text-gray-400 text-sm italic">Nenhuma</span>
                            ) : (
                              <>
                                {product.restricoes.slice(0, 3).map((r) => (
                                  <span
                                    key={r}
                                    className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-stone-100 text-stone-600 border border-stone-200"
                                  >
                                    {r.replace(/_/g, ' ')}
                                  </span>
                                ))}
                                {product.restricoes.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200">
                                    +{product.restricoes.length - 3}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingId === product.id}
                              className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                            >
                              {deletingId === product.id ? (
                                <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                              <span className="hidden sm:inline">Excluir</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && !error && (
          <p className="text-xs text-gray-400 text-right mt-4">
            {filtered.length} produto{filtered.length !== 1 ? 's' : ''} exibido{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== products.length && ` de ${products.length}`}
          </p>
        )}
            </div>
          )}
          
          {activeTab === 'LOGS' && (
            <div className="bg-white rounded-xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100 p-6 overscroll-contain">
              {loadingLogs ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-gray-100 border-t-orange-600 rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-500 font-medium">Carregando logs...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">{error}</p>
                </div>
              ) : (
                <div className="space-y-6 max-w-[100vw] overflow-x-hidden">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                     <h3 className="text-lg font-bold text-gray-900">Histórico de IA</h3>
                     <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold">
                       {logs.length} requisições
                     </span>
                  </div>
                  {logs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">Nenhum log encontrado.</div>
                  ) : (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                      {logs.map((log: any, index: number) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden text-sm transition-all duration-200">
                           <button 
                             onClick={() => setExpandedLogId(expandedLogId === index ? null : index)}
                             className="w-full flex justify-between items-center p-4 hover:bg-gray-100 transition-colors"
                           >
                             <div className="flex items-center gap-2">
                               <div className="font-semibold text-gray-700">Requisição {logs.length - index}</div>
                               {/* Lightning icon for Gemini 2.5 Flash */}
                               {log.model && typeof log.model === 'string' && log.model.includes('2.5') && log.model.includes('flash') && (
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                                   <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                                 </svg>
                               )}
                               <div className={`p-1 rounded-full transition-transform ${expandedLogId === index ? 'rotate-180' : ''}`}>
                                 <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                 </svg>
                               </div>
                             </div>
                             <div className="text-xs text-gray-400 font-mono text-right">
                               {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                               <br />
                               {log.processingTimeMs && `${log.processingTimeMs}ms`}
                             </div>
                           </button>
                           
                           {/* Log Details - Collapsible */}
                           {expandedLogId === index && (
                             <div className="p-4 border-t border-gray-200 bg-white">
                               {log.model && (
                                 <div className="mb-4 text-xs font-medium text-gray-500">
                                   Modelo: <span className="text-gray-900 font-mono ml-1 bg-gray-100 px-2 py-1 rounded">{log.model}</span>
                                 </div>
                               )}
                               {log.request && (
                                 <div className="mt-3">
                                   <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Prompt / Mensagens</div>
                                   <pre className="bg-gray-800 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-xs shadow-inner">
                                     {typeof log.request === 'string' ? log.request : JSON.stringify(log.request, null, 2)}
                                   </pre>
                                 </div>
                               )}
                               
                               {log.response && (
                                 <div className="mt-4">
                                   <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Resposta / Output</div>
                                   <pre className="bg-gray-50 text-gray-800 border border-gray-300 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                                     {typeof log.response === 'string' ? log.response : JSON.stringify(log.response, null, 2)}
                                   </pre>
                                 </div>
                               )}

                               {log.raw_json && !log.request && !log.response && (
                                 <div className="mt-4">
                                   <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Raw JSON</div>
                                   <pre className="bg-gray-900 text-gray-300 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-xs shadow-inner">
                                     {log.raw_json}
                                   </pre>
                                 </div>
                               )}
                             </div>
                           )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-right-8 fade-in duration-300 ${
              toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.message}
          </div>
        ))}
      </div>

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default App;
