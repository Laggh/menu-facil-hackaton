import { useState, useEffect, useRef } from 'react';
import type { Produto, Categoria, Restricao } from '@shared/types';
import { RestricaoArray, RESTRICAO_INFO } from '@shared/types';
import api from '../lib/api';

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'PRATO_PRINCIPAL', label: 'Prato Principal' },
  { value: 'ACOMPANHAMENTOS', label: 'Acompanhamentos' },
  { value: 'BEBIDAS', label: 'Bebidas' },
  { value: 'SOBREMESA', label: 'Sobremesa' },
  { value: 'OUTROS', label: 'Outros' },
];

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

  const handleGenerateAI = async () => {
    if (!form.nome.trim()) {
      setError('Preencha o nome do produto antes de gerar com IA.');
      return;
    }
    setAiLoading(true);
    setNeedsDefinicao(false);
    setError(null);
    try {
      const { data } = await api.products.generateDescription(form.nome, form.definicao || '');
      applyAiData(data);
      setNeedsDefinicao(false);
    } catch {
      setNeedsDefinicao(true);
      setError('A IA precisa de mais detalhes sobre esse produto. Preencha o campo "Definição" e tente novamente.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 transition-transform transform">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            {product ? 'Editar Produto' : 'Novo Produto'}
            {aiLoading && (
              <span className="flex h-5 w-5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-orange-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors text-lg leading-none focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl px-4 py-3 flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            {/* Nome */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Nome <span className="text-orange-500">*</span></label>
              <input
                required
                type="text"
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="Ex: Frango Grelhado"
              />
            </div>

            {/* Preço */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Preço (R$) <span className="text-orange-500">*</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-medium">R$</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={precoStr}
                  onChange={(e) => setPrecoStr(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-gray-50 hover:bg-white focus:bg-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Categoria */}
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Categoria <span className="text-orange-500">*</span></label>
              <select
                value={form.categoria}
                onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value as Categoria }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-gray-50 hover:bg-white focus:bg-white appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Upload de Imagem */}
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Imagem</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload-input"
              />
              {uploadingImage ? (
                <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-orange-300 rounded-xl bg-orange-50/50 gap-2">
                  <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-orange-600">Fazendo upload...</span>
                </div>
              ) : form.imagem_url ? (
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <img
                    src={form.imagem_url}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-xl border border-gray-100 flex-shrink-0 shadow-sm"
                  />
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <span className="text-xs font-medium text-gray-500 truncate bg-gray-50 px-2 py-1 rounded-md">{form.imagem_url}</span>
                    <div className="flex gap-3 mt-1">
                      <label
                        htmlFor="image-upload-input"
                        className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-bold transition-colors"
                      >
                        Trocar imagem
                      </label>
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, imagem_url: '' }))}
                        className="text-sm text-red-500 hover:text-red-700 font-bold transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="image-upload-input"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-orange-50/50 hover:border-orange-400/50 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-600">Clique para selecionar uma imagem</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP até 4 MB</span>
                </label>
              )}
            </div>

            {/* Definição */}
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex justify-between items-end">
                <span>
                  Definição{' '}
                  <span className="text-gray-400 font-medium">(usada para geração de descrição pela IA)</span>
                </span>
                <div className="relative group flex items-center">
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Gerar com IA
                  </button>
                  <div className="absolute right-0 bottom-full mb-2 w-48 p-2.5 bg-gray-900 text-white text-xs text-center rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl">
                    <span className="font-semibold block mb-1">Atenção</span>
                    A geração por IA pode demorar de 5 até 15 segundos.
                    <div className="absolute top-full right-8 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </label>
              <textarea
                rows={2}
                value={form.definicao}
                onChange={(e) => setForm((p) => ({ ...p, definicao: e.target.value }))}
                className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all resize-none ${
                  needsDefinicao 
                    ? 'border-2 border-orange-400 bg-orange-50 shadow-[0_0_0_4px_rgba(251,146,60,0.1)]' 
                    : 'border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:bg-white focus:bg-white'
                }`}
                placeholder="Descreva o produto de forma objetiva (ex: 'Hambúrguer artesanal carne de 180g e queijo cheddar')"
              />
              {needsDefinicao && (
                <div className="flex items-center gap-2 mt-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-xs font-semibold">
                    A IA precisa de mais detalhes para gerar a descrição.
                  </p>
                </div>
              )}
            </div>

            {/* Descrição */}
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Descrição para o cliente</label>
              <textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-gray-50 hover:bg-white focus:bg-white resize-none"
                placeholder="Texto atraente exibido no cardápio..."
              />
            </div>

            {/* Ingredientes */}
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Ingredientes{' '}
                <span className="text-gray-400 font-medium">(separados por vírgula)</span>
              </label>
              <input
                type="text"
                value={ingredientesStr}
                onChange={(e) => setIngredientesStr(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="Arroz, Feijão, Frango..."
              />
            </div>

            {/* Restrições */}
            <div className="col-span-2">
              <div className="mb-3">
                <label className="block text-sm font-bold text-gray-700">Restrições Alimentares</label>
                <p className="text-xs text-gray-500 mt-0.5">Selecione as condições que <strong className="text-gray-700">impedem</strong> consumir o produto.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {RestricaoArray.map((r) => {
                  const isChecked = form.restricoes.includes(r);
                  return (
                    <label
                      key={r}
                      className={`group relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-orange-500 bg-orange-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        isChecked ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRestricao(r)}
                        className="hidden"
                      />
                      <span className={`text-sm font-medium ${isChecked ? 'text-orange-900' : 'text-gray-700'}`}>
                        {RESTRICAO_INFO[r].label}
                      </span>

                      {/* Tooltip de Exemplos */}
                      {RESTRICAO_INFO[r].exemplos && (
                        <div className="absolute flex flex-col items-center bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-gray-900 text-white text-xs text-center rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl">
                          <span className="font-semibold mb-1 border-b border-gray-700 pb-1 w-full">{RESTRICAO_INFO[r].label}</span>
                          <span className="text-gray-300 leading-tight">{RESTRICAO_INFO[r].exemplos}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100 sticky bottom-0 bg-white py-4 -mx-6 px-6 shadow-[0_-10px_15px_-3px_rgba(255,255,255,0.9)]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="px-5 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-black disabled:opacity-50 disabled:active:scale-100 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>Salvar Produto</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
