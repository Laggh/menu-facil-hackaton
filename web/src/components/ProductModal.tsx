import { useState, useEffect, useRef } from 'react';
import type { Produto, Categoria, Restricao } from '@shared/types';
import { RestricaoArray } from '@shared/types';
import api from '../lib/api';

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'PRATO_PRINCIPAL', label: 'Prato Principal' },
  { value: 'ACOMPANHAMENTOS', label: 'Acompanhamentos' },
  { value: 'BEBIDAS', label: 'Bebidas' },
  { value: 'SOBREMESA', label: 'Sobremesa' },
  { value: 'OUTROS', label: 'Outros' },
];

const RESTRICAO_LABELS: Record<Restricao, string> = {
  VEGETARIANO: 'Vegetariano',
  VEGANO: 'Vegano',
  SEM_ACUCAR: 'Sem Açúcar',
  SEM_SODIO: 'Sem Sódio',
  CETOGENICO: 'Cetogênico',
  SEM_GLUTEN: 'Sem Glúten',
  SEM_LACTOSE: 'Sem Lactose',
  APLV: 'APLV',
  SEM_OLEAGINOSAS: 'Sem Oleaginosas',
  SEM_FRUTOS_DO_MAR: 'Sem Frutos do Mar',
  OUTROS: 'Outros',
};

type FormData = Omit<Produto, 'id'>;

interface Props {
  product?: Produto | null;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
}

const EMPTY_FORM: FormData = {
  nome: '',
  definicao: '',
  descricao: '',
  preco: 0,
  categoria: 'PRATO_PRINCIPAL',
  imagem_url: '',
  ingredientes: [],
  restricoes: [],
};

export function ProductModal({ product, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [ingredientesStr, setIngredientesStr] = useState('');
  const [precoStr, setPrecoStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [needsDefinicao, setNeedsDefinicao] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setForm({
        nome: product.nome,
        definicao: product.definicao,
        descricao: product.descricao,
        preco: product.preco,
        categoria: product.categoria,
        imagem_url: product.imagem_url,
        ingredientes: product.ingredientes,
        restricoes: product.restricoes,
      });
      setIngredientesStr(product.ingredientes.join(', '));
      setPrecoStr(product.preco > 0 ? String(product.preco) : '');
    } else {
      setForm(EMPTY_FORM);
      setIngredientesStr('');
      setPrecoStr('');
    }
  }, [product]);

  const applyAiData = (data: { definicao: string | null; descricao: string; restricoes: Restricao[]; ingredientes: string[] }) => {
    setForm((p) => ({
      ...p,
      definicao: data.definicao ?? p.definicao,
      descricao: data.descricao,
      restricoes: data.restricoes,
    }));
    setIngredientesStr(data.ingredientes.join(', '));
  };

  const handleNomeBlur = async () => {
    if (product || !form.nome.trim()) return;
    setAiLoading(true);
    setNeedsDefinicao(false);
    try {
      const { data } = await api.products.generateDescription(form.nome);
      applyAiData(data);
    } catch {
      setNeedsDefinicao(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDefinicaoBlur = async () => {
    if (!needsDefinicao || !form.nome.trim() || !form.definicao.trim()) return;
    setAiLoading(true);
    try {
      const { data } = await api.products.generateDescription(form.nome, form.definicao);
      applyAiData(data);
      setNeedsDefinicao(false);
    } catch {
      // still not enough info, keep hint visible
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const { url } = await api.uploadImage(file);
      setForm((p) => ({ ...p, imagem_url: url }));
    } catch {
      setError('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingImage(false);
      // Reset input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave({
        ...form,
        preco: parseFloat(precoStr) || 0,
        ingredientes: ingredientesStr.split(',').map((s) => s.trim()).filter(Boolean),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const toggleRestricao = (r: Restricao) => {
    setForm((prev) => ({
      ...prev,
      restricoes: prev.restricoes.includes(r)
        ? prev.restricoes.filter((x) => x !== r)
        : [...prev.restricoes, r],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {product ? 'Editar Produto' : 'Novo Produto'}
            {aiLoading && (
              <span className="inline-block w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Nome */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                required
                type="text"
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                onBlur={handleNomeBlur}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ex: Frango Grelhado"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value as Categoria }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={precoStr}
                onChange={(e) => setPrecoStr(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0.00"
              />
            </div>

            {/* Upload de Imagem */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagem</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload-input"
              />
              {uploadingImage ? (
                <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50">
                  <span className="text-sm text-orange-500 animate-pulse">Enviando imagem...</span>
                </div>
              ) : form.imagem_url ? (
                <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <img
                    src={form.imagem_url}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                  />
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs text-gray-500 truncate">{form.imagem_url}</span>
                    <div className="flex gap-2">
                      <label
                        htmlFor="image-upload-input"
                        className="text-sm text-orange-500 hover:text-orange-600 cursor-pointer font-medium"
                      >
                        Trocar imagem
                      </label>
                      <span className="text-gray-300">·</span>
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, imagem_url: '' }))}
                        className="text-sm text-red-400 hover:text-red-600 font-medium"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="image-upload-input"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-orange-50 hover:border-orange-400 transition-colors"
                >
                  <span className="text-2xl mb-1">🖼️</span>
                  <span className="text-sm text-gray-500">Clique para selecionar uma imagem</span>
                  <span className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP até 4 MB</span>
                </label>
              )}
            </div>

            {/* Definição */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Definição{' '}
                <span className="text-gray-400 font-normal">(usada para geração de descrição pela IA)</span>
              </label>
              <textarea
                rows={2}
                value={form.definicao}
                onChange={(e) => setForm((p) => ({ ...p, definicao: e.target.value }))}
                onBlur={handleDefinicaoBlur}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none ${
                  needsDefinicao ? 'border-orange-400 bg-orange-50' : 'border-gray-300'
                }`}
                placeholder="Descreva o produto de forma objetiva para a IA"
              />
              {needsDefinicao && (
                <p className="text-xs text-orange-500 mt-1">
                  ✦ A IA precisou de mais detalhes. Preencha a definição e clique fora do campo para gerar automaticamente.
                </p>
              )}
            </div>

            {/* Descrição */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Descrição exibida para o cliente"
              />
            </div>

            {/* Ingredientes */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredientes{' '}
                <span className="text-gray-400 font-normal">(separados por vírgula)</span>
              </label>
              <input
                type="text"
                value={ingredientesStr}
                onChange={(e) => setIngredientesStr(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Arroz, Feijão, Frango..."
              />
            </div>

            {/* Restrições */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restrições Alimentares
              </label>
              <div className="grid grid-cols-3 gap-2">
                {RestricaoArray.map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={form.restricoes.includes(r)}
                      onChange={() => toggleRestricao(r)}
                      className="accent-orange-500 w-4 h-4"
                    />
                    {RESTRICAO_LABELS[r]}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg transition-colors"
            >
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
