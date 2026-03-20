import { useState, useEffect, useCallback } from 'react';
import type { GeminiLog } from '@shared/types';
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

export function LogsTab() {
  const [logs, setLogs] = useState<(GeminiLog & { raw?: string })[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadLogs = useCallback(async (isBackground: boolean = false) => {
    const background = isBackground === true;
    try {
      if (!background) setLoadingLogs(true);
      if (!background) setError(null);
      const { logs } = await api.logs.getAll();
      setLogs(logs as (GeminiLog & { raw?: string })[]);
    } catch (err) {
      if (!background) setError(err instanceof Error ? err.message : 'Erro ao carregar logs');
    } finally {
      if (!background) setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadLogs(true);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, loadLogs]);

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Logs de Integração da IA</h2>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-500 border-gray-300 w-4 h-4 cursor-pointer"
            />
            Atualizar a cada 2s
          </label>
          <button
            onClick={() => loadLogs(false)}
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
              {logs.map((log, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl text-sm transition-all duration-200">
                  <button
                    onClick={() => setExpandedLogId(expandedLogId === index ? null : index)}
                    className={`w-full flex justify-between items-center p-4 hover:bg-gray-100 transition-colors ${expandedLogId === index ? 'rounded-t-xl' : 'rounded-xl'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-700">Requisição {logs.length - index}</div>
                        {log.usedFallback ? (
                          <div className="group relative flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-orange-500 cursor-pointer">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                            <div className="absolute flex items-center left-full top-1/2 -translate-y-1/2 ml-2 w-max px-3 py-2 bg-gray-900 text-white text-xs text-center rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl">
                              <span className="font-semibold whitespace-nowrap">Usou modelo de fallback (Secundário)</span>
                              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                            </div>
                          </div>
                        ) : log.model && typeof log.model === 'string' && log.model.includes('2.5') && log.model.includes('flash') ? (
                          <div className="group relative flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500 cursor-pointer">
                              <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                            </svg>
                            <div className="absolute flex items-center left-full top-1/2 -translate-y-1/2 ml-2 w-max px-3 py-2 bg-gray-900 text-white text-xs text-center rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl">
                              <span className="font-semibold whitespace-nowrap">Modelo Rápido (Flash)</span>
                              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                            </div>
                          </div>
                        ) : null}
                      {log.status === 'error' && (
                        <div className="group relative flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-red-500 cursor-pointer">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <div className="absolute flex items-center left-full top-1/2 -translate-y-1/2 ml-2 w-max px-3 py-2 bg-gray-900 text-white text-xs text-center rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl">
                            <span className="font-semibold whitespace-nowrap">Erro na Integração</span>
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                          </div>
                        </div>
                      )}
                      <div className={`p-1 rounded-full transition-transform ${expandedLogId === index ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono text-right">
                      {log.timestamp ? `${getRelativeTime(log.timestamp)} • ` : ''}{log.timeMs && `${log.timeMs}ms`}
                    </div>
                  </button>

                  {expandedLogId === index && (
                    <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
                      {log.model && (
                          <div className="mb-4 text-xs font-medium text-gray-500 flex items-center">
                            Modelo: <span className="text-gray-900 font-mono ml-1 bg-gray-100 px-2 py-1 rounded">{log.model}</span>
                            {log.usedFallback && (
                              <span className="ml-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider border border-orange-200" title="Requisição original falhou, modelo de emergência ativado">
                                🔥 Fallback
                              </span>
                            )}
                          </div>
                      )}
                      
                      {log.status === 'error' && (
                        <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-lg">
                          <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
                            Erro {log.errorCode ? `(${log.errorCode})` : ''}
                          </div>
                          <div className="text-sm text-red-600 font-medium">
                            {log.errorMessage || 'Ocorreu um erro desconhecido.'}
                          </div>
                        </div>
                      )}

                      {log.prompt && (
                        <div className="mt-3">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Prompt / Mensagens</div>
                          <pre className="bg-gray-800 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-xs shadow-inner">
                            {typeof log.prompt === 'string' ? log.prompt : JSON.stringify(log.prompt, null, 2)}
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

                      {log.raw && !log.prompt && !log.response && (
                        <div className="mt-4">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Raw JSON</div>
                          <pre className="bg-gray-900 text-gray-300 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-xs shadow-inner">
                            {typeof log.raw === 'string' ? log.raw : JSON.stringify(log.raw, null, 2)}
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

