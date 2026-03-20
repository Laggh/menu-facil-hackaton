import { useState, useEffect, useCallback } from 'react';
import type { Task } from '@shared/types';
import api from '../../lib/api';

function getRelativeTime(dateString: string | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (Math.abs(diffSec) < 60) return 'agora mesmo';
  
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  return rtf.format(diffDay, 'day');
}

export function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, failed: 0 });
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadTasks = useCallback(async (isBackground: boolean = false) => {
    const background = isBackground === true;
    try {
      if (!background) setLoadingTasks(true);
      if (!background) setError(null);
      const res = await api.tasks.getAll();
      setTasks(res.tasks || []);
      setStats({
        total: res.total || 0,
        pending: res.pending || 0,
        completed: res.completed || 0,
        failed: res.failed || 0
      });
    } catch (err) {
      if (!background) setError(err instanceof Error ? err.message : 'Erro ao carregar tasks');
    } finally {
      if (!background) setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadTasks(true);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, loadTasks]);

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Fila de Tasks</h2>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-500 focus:ring-blue-500 border-gray-300 w-4 h-4 cursor-pointer"
            />
            Atualizar a cada 5s
          </label>
          <button
            onClick={() => loadTasks(false)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="bg-white rounded-xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100 p-6 overscroll-contain">
          {loadingTasks ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Carregando tasks...</p>
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
            <h3 className="text-lg font-bold text-gray-900">Histórico de Tasks</h3>
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                {stats.total} total
              </span>
              <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                {stats.pending} pendentes
              </span>
              <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                {stats.completed} concluídas
              </span>
              <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                {stats.failed} falhas
              </span>
            </div>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Nenhuma task encontrada.</div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {tasks.map((task) => (
                  <div key={task.id} className="bg-gray-50 border border-gray-200 rounded-xl text-sm transition-all duration-200">
                    <button
                      onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                      className={`w-full flex justify-between items-center p-4 hover:bg-gray-100 transition-colors ${expandedTaskId === task.id ? 'rounded-t-xl' : 'rounded-xl'}`}
                  >
                    <div className="flex items-center gap-3">
                      
                      {task.status === 'completed' && (
                        <div className="group relative flex items-center">
                          <svg className="w-5 h-5 text-green-500 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <div className="absolute flex items-center left-full top-1/2 -translate-y-1/2 ml-2 w-max px-3 py-2 bg-gray-900 text-white text-xs text-center rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl">
                            <span className="font-semibold whitespace-nowrap text-green-300">Concluída</span>
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                          </div>
                        </div>
                      )}
                      {task.status === 'failed' && (
                        <div className="group relative flex items-center">
                          <svg className="w-5 h-5 text-red-500 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <div className="absolute flex items-center left-full top-1/2 -translate-y-1/2 ml-2 w-max px-3 py-2 bg-gray-900 text-white text-xs text-center rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl">
                            <span className="font-semibold whitespace-nowrap text-red-300">Falha</span>
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                          </div>
                        </div>
                      )}
                      {task.status === 'pending' && (
                        <div className="group relative flex items-center">
                          <svg className="w-5 h-5 text-yellow-500 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                          </svg>
                          <div className="absolute flex items-center left-full top-1/2 -translate-y-1/2 ml-2 w-max px-3 py-2 bg-gray-900 text-white text-xs text-center rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl">
                            <span className="font-semibold whitespace-nowrap text-yellow-300">Pendente</span>
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                          </div>
                        </div>
                      )}
                      {task.status === 'processing' && (
                        <div className="group relative flex items-center">
                          <svg className="w-5 h-5 text-blue-500 animate-spin cursor-pointer" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <div className="absolute flex items-center left-full top-1/2 -translate-y-1/2 ml-2 w-max px-3 py-2 bg-gray-900 text-white text-xs text-center rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl">
                            <span className="font-semibold whitespace-nowrap text-blue-300">Processando</span>
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                          </div>
                        </div>
                      )}

                      <div className="font-semibold text-gray-700">{task.type}</div>
                      
                      <div className="font-mono text-xs text-gray-400 bg-gray-200/50 px-2 py-0.5 rounded">
                        #{task.id.slice(0, 8)}
                      </div>

                      <div className={`p-1 rounded-full transition-transform ${expandedTaskId === task.id ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono text-right">
                      {task.createdAt ? `${getRelativeTime(task.createdAt)}` : ''}
                    </div>
                  </button>

                  {expandedTaskId === task.id && (
                    <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
                      
                      <div className="flex gap-6 mb-4">
                        <div className="text-xs text-gray-500">
                          Status: <span className="font-bold text-gray-900 ml-1 uppercase">{task.status}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Tentativas: <span className="font-bold text-gray-900 ml-1">{task.attempts} / {task.maxAttempts}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Criado: <span className="font-bold text-gray-900 ml-1">{new Date(task.createdAt).toLocaleString()}</span>
                        </div>
                        {task.completedAt && (
                          <div className="text-xs text-gray-500">
                            Concluído: <span className="font-bold text-gray-900 ml-1">{new Date(task.completedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {task.status === 'failed' && task.lastError && (
                        <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-lg">
                          <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
                            Erro da Task
                          </div>
                          <div className="text-sm text-red-600 font-medium">
                            {task.lastError}
                          </div>
                        </div>
                      )}

                      {task.payload && (
                        <div className="mt-3">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Payload / Dados</div>
                          <pre className="bg-gray-50 text-gray-800 border border-gray-300 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                            {JSON.stringify(task.payload, null, 2)}
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
      </main>
    </>
  );
}
