import { useState, useEffect } from 'react';
import type { Usuario } from '@shared/types';
import api from '../../lib/api';

export function UsuariosTab() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserForEtiqueta, setSelectedUserForEtiqueta] = useState<Usuario | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const res = await api.users.getAll();
        setUsers(res.users);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Usuários</h2>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4 mt-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">👥</div>
            <p className="font-medium">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-semibold text-gray-500">
                    <th className="p-4 pl-6 font-medium">Nome</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Idade</th>
                    <th className="p-4 pr-6 font-medium">Etiqueta do Cliente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="font-medium text-gray-900">{user.nome}</div>
                      </td>
                      <td className="p-4 text-gray-600">{user.email}</td>
                      <td className="p-4 text-gray-600">{user.idade}</td>
                      <td className="p-4 pr-6">
                        {user.etiqueta ? (
                          <button
                            onClick={() => setSelectedUserForEtiqueta(user)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Ver Etiqueta
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm italic ml-2">Não tem</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal da Etiqueta */}
      {selectedUserForEtiqueta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Etiqueta do Cliente
              </h3>
              <button
                onClick={() => setSelectedUserForEtiqueta(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Cliente:</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-bold uppercase">
                    {selectedUserForEtiqueta.nome.charAt(0)}
                  </span>
                  {selectedUserForEtiqueta.nome}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Perfil/Preferências:</p>
                <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedUserForEtiqueta.etiqueta}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedUserForEtiqueta(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
