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
  PRATO_PRINCIPAL: 'bg-orange-100 text-orange-700',
  ACOMPANHAMENTOS: 'bg-yellow-100 text-yellow-700',
  BEBIDAS: 'bg-blue-100 text-blue-700',
  SOBREMESA: 'bg-pink-100 text-pink-700',
  OUTROS: 'bg-gray-100 text-gray-600',
};

const ALL_CATEGORIAS = Object.keys(CATEGORIA_LABELS) as Categoria[];

function App() {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Categoria | 'ALL'>('ALL');

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

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir produto');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (data: Omit<Produto, 'id'>) => {
    if (editingProduct) {
      const { product } = await api.products.update(editingProduct.id, data);
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? product : p)));
    } else {
      const { product } = await api.products.create(data);
      setProducts((prev) => [...prev, product]);
    }
    setModalOpen(false);
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
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg select-none">
              M
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">Menu Fácil</h1>
              <p className="text-xs text-gray-400 mt-0.5">Painel Administrativo</p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <span className="text-lg leading-none">+</span> Novo Produto
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{products.length}</p>
          </div>
          {ALL_CATEGORIAS.map((cat) => (
            <div key={cat} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-400 truncate">{CATEGORIA_LABELS[cat]}</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{categoryCounts[cat] ?? 0}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Categoria | 'ALL')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">Todas as categorias</option>
            {ALL_CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>{CATEGORIA_LABELS[cat]}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
              Carregando produtos...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={loadProducts}
                className="text-sm text-orange-500 hover:underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Produto</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Categoria</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Preço</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3 hidden lg:table-cell">Restrições</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-sm text-gray-400 py-16">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      {/* Produto */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.imagem_url ? (
                            <img
                              src={product.imagem_url}
                              alt={product.nome}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-xl flex-shrink-0 select-none">
                              🍽
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{product.nome}</p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{product.descricao}</p>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORIA_COLORS[product.categoria]}`}>
                          {CATEGORIA_LABELS[product.categoria]}
                        </span>
                      </td>

                      {/* Preço */}
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {product.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Restrições */}
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {product.restricoes.length === 0 ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <>
                              {product.restricoes.slice(0, 3).map((r) => (
                                <span
                                  key={r}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 border border-green-200"
                                >
                                  {r.replace(/_/g, ' ')}
                                </span>
                              ))}
                              {product.restricoes.length > 3 && (
                                <span className="text-xs text-gray-400 self-center">
                                  +{product.restricoes.length - 3}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-sm text-gray-600 hover:text-orange-500 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                            className="text-sm text-gray-600 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            {deletingId === product.id ? '...' : 'Excluir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && (
          <p className="text-xs text-gray-400 text-right">
            {filtered.length} produto{filtered.length !== 1 ? 's' : ''} exibido{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== products.length && ` de ${products.length}`}
          </p>
        )}
      </main>

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
