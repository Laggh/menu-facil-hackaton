import { useState, useEffect, useCallback } from 'react';
import type { Pedido, StatusPedido, Usuario } from '@shared/types';
import api from '../../lib/api';

export function PedidosTab() {
  const [pendentes, setPendentes] = useState<Pedido[]>([]);
  const [completos, setCompletos] = useState<Pedido[]>([]);
  const [cancelados, setCancelados] = useState<Pedido[]>([]);
  const [arquivados, setArquivados] = useState<Pedido[]>([]);
  const [usuarios, setUsuarios] = useState<Record<string, Usuario>>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [atualizandoPedidoId, setAtualizandoPedidoId] = useState<string | null>(null);

  const [archiveModalData, setArchiveModalData] = useState<{ status: StatusPedido, orders: Pedido[] } | null>(null);
  const [isArchivingAll, setIsArchivingAll] = useState(false);

  const loadData = useCallback(async (isBackground: boolean = false) => {
    try {
      if (!isBackground) setLoading(true);
      if (!isBackground) setError(null);
      
      const [ordersRes, usersRes] = await Promise.all([
        api.orders.getAll(),
        api.users.getAll().catch(() => ({ users: [] })),
      ]);

      // O banco de dados pode não retornar em ordem decrescente, vamos ordenar por id (timestamp invertido)
      const sortByRecency = (a: Pedido, b: Pedido) => Number(b.id) - Number(a.id);
      
      setPendentes((ordersRes.pendentes || []).sort(sortByRecency));
      setCompletos((ordersRes.completos || []).sort(sortByRecency));
      setCancelados((ordersRes.cancelados || []).sort(sortByRecency));
      setArquivados((ordersRes.arquivados || []).sort(sortByRecency));

      const userMap = (usersRes.users || []).reduce((acc: Record<string, Usuario>, u) => {
        acc[u.id] = u;
        return acc;
      }, {});
      setUsuarios(userMap);
      
    } catch (err) {
      if (!isBackground) setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadData(true);
      }, 5000); // 5s refresh for orders
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, loadData]);

  const handleStatusChange = async (pedidoId: string, novoStatus: StatusPedido) => {
    try {
      setAtualizandoPedidoId(pedidoId);
      await api.orders.updateStatus(pedidoId, novoStatus);
      await loadData(true);
    } catch (err) {
      alert('Erro ao atualizar status: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAtualizandoPedidoId(null);
    }
  };

  const handleArchive = async (pedidoId: string) => {
    try {
      await api.orders.archive(pedidoId);
      loadData(true);
    } catch (err) {
      alert('Erro ao arquivar: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleArchiveAllClick = (status: StatusPedido, ordersToArchive: Pedido[]) => {
    setArchiveModalData({ status, orders: ordersToArchive });
  };

  const confirmArchiveAll = async () => {
    if (!archiveModalData) return;
    setIsArchivingAll(true);
    try {
      await Promise.all(archiveModalData.orders.map(o => api.orders.archive(o.id)));
      await loadData(true);
      setArchiveModalData(null);
    } catch (err) {
      alert('Erro ao arquivar alguns pedidos: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsArchivingAll(false);
    }
  };

  const Column = ({ title, status, orders }: { title: string, status: StatusPedido, orders: Pedido[] }) => (
    <div className="flex-1 flex flex-col bg-gray-50/50 border border-gray-200 rounded-xl overflow-hidden min-w-[300px]">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex justify-between items-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          {status === 'PENDENTE' && <div className="w-2 h-2 rounded-full bg-orange-400"></div>}
          {status === 'COMPLETO' && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
          {status === 'CANCELADO' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
          {status === 'ARQUIVADO' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {(status === 'COMPLETO' || status === 'CANCELADO') && orders.length > 0 && (
            <button 
              onClick={() => handleArchiveAllClick(status, orders)} 
              className="text-[10px] uppercase font-bold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2 py-1 rounded transition-colors flex items-center gap-1 leading-none h-fit"
            >
              Arquivar Todos
            </button>
          )}
          <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0">
            {orders.length}
          </span>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 shadow-inner bg-gray-50/50">
        {orders.map(o => (
           <div key={o.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
             <div className="flex justify-between items-start">
               <div>
                  <div className="text-xs text-gray-400 font-mono">#{o.id.slice(-6)} • {o.horario}</div>
                  <div className="font-bold text-gray-900 mt-0.5 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {usuarios[o.usuarioId]?.nome || 'Cliente'}
                  </div>
               </div>
               <div className="text-sm font-black text-orange-600 whitespace-nowrap">
                  R$ {o.preco_total.toFixed(2).replace('.', ',')}
               </div>
             </div>
             
             <div className="border-t border-gray-100 pt-3 flex flex-col gap-1.5">
               {o.produtos.map((item, idx) => (
                 <div key={idx} className="flex flex-col">
                   <div className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="font-bold text-gray-900 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-xs">{item.quantidade}x</span> 
                      <span className="leading-snug">{item.produto.nome}</span>
                   </div>
                   {item.observacao && (
                     <div className="ml-7 mt-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                       <span className="font-bold">Obs:</span> {item.observacao}
                     </div>
                   )}
                 </div>
               ))}
             </div>

             <div className="border-t border-gray-100 pt-3 flex gap-2 justify-end mt-1">
               {status === 'PENDENTE' && (
                 <>
                   <button onClick={() => handleStatusChange(o.id, 'CANCELADO')} className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">Cancelar</button>
                   <button 
                    disabled={atualizandoPedidoId === o.id}
                    onClick={() => handleStatusChange(o.id, 'COMPLETO')} 
                    className={`px-3 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5 ${atualizandoPedidoId === o.id ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-600'}`}>
                    {atualizandoPedidoId === o.id ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                    Entregar
                   </button>
                 </>
               )}
               {status === 'COMPLETO' && (
                 <>
                   <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     Finalizado
                   </span>
                   <button onClick={() => handleArchive(o.id)} className="text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors ml-auto flex items-center gap-1" title="Arquivar">
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                     Arquivar
                   </button>
                 </>
               )}
               {status === 'CANCELADO' && (
                 <>
                   <button onClick={() => handleStatusChange(o.id, 'PENDENTE')} className="text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors">
                     Desfazer Cancelamento
                   </button>
                   <button onClick={() => handleArchive(o.id)} className="text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors ml-auto flex items-center gap-1" title="Arquivar">
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                     Arquivar
                   </button>
                 </>
               )}
               {status === 'ARQUIVADO' && (
                 <button onClick={() => handleStatusChange(o.id, 'COMPLETO')} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border border-blue-100 hover:border-blue-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 ml-auto transition-colors cursor-pointer" title="Desarquivar pedido">
                   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                   Desarquivar
                 </button>
               )}
             </div>
           </div>
        ))}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
            <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2-2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            <span className="text-sm font-medium">Vazio</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Fila de Pedidos</h2>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-500 border-gray-300 w-4 h-4 cursor-pointer"
            />
            Atualização Automática (5s)
          </label>
          <button
            onClick={() => setShowArchived(prev => !prev)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95 ${showArchived ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {showArchived ? 'Ocultar Arquivados' : 'Ver Arquivados'}
          </button>
          <button
            onClick={() => loadData(false)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-6">
        {error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center justify-center gap-3 w-fit m-auto mt-10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">{error}</p>
          </div>
        ) : (
          <div className="flex gap-6 h-full min-w-max">
            {!showArchived ? (
              <>
                <Column title="Pendentes / Em Preparo" status="PENDENTE" orders={pendentes} />
                <Column title="Prontos" status="COMPLETO" orders={completos} />
                <Column title="Cancelados" status="CANCELADO" orders={cancelados} />
              </>
            ) : (
              <Column title="Histórico Arquivado" status="ARQUIVADO" orders={arquivados} />
            )}
          </div>
        )}
      </main>
      {/* Archive All Modal */}
      {archiveModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Arquivar Pedidos</h3>
              <p className="text-gray-600 text-sm">
                Tem certeza que deseja mover todos os <strong>{archiveModalData.orders.length} pedidos</strong> retornados para o histórico de arquivados?
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button 
                onClick={() => setArchiveModalData(null)}
                disabled={isArchivingAll}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmArchiveAll}
                disabled={isArchivingAll}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isArchivingAll ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Arquivando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}    </div>
  );
}
