import { useState, useCallback, useEffect, useRef } from 'react';
import { DashboardTab } from './components/tabs/DashboardTab';
import { PedidosTab } from './components/tabs/PedidosTab';
import { CardapioTab } from './components/tabs/CardapioTab';
import { LogsTab } from './components/tabs/LogsTab';
import { UsuariosTab } from './components/tabs/UsuariosTab';
import { TasksTab } from './components/tabs/TasksTab';
import api from './lib/api';

type Tab = 'DASHBOARD' | 'CARDAPIO' | 'PEDIDOS' | 'LOGS' | 'USUARIOS' | 'TASKS';

type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error';
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('CARDAPIO');
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [pendentesCount, setPendentesCount] = useState(0);
  const [pendentesTasksCount, setPendentesTasksCount] = useState(0);
  const [totalErrorLogs, setTotalErrorLogs] = useState(0);
  const [seenErrorLogs, setSeenErrorLogs] = useState(0);
  
  const [isGestaoOpen, setIsGestaoOpen] = useState(true);
  const [isSistemaOpen, setIsSistemaOpen] = useState(true);
  
  const initialLoadDone = useRef(false);

  const fetchSummary = useCallback(async () => {
    try {
      const [ordersRes, logsRes, tasksRes] = await Promise.all([
        api.orders.getAll().catch(() => null),
        api.logs.getAll().catch(() => null),
        api.tasks.getAll().catch(() => null)
      ]);
      
      if (ordersRes && ordersRes.pendentes) {
        setPendentesCount(ordersRes.pendentes.length);
      }
      
      if (logsRes && logsRes.logs) {
        const errorLogs = logsRes.logs.filter((l: any) => l.status === 'error').length;
        setTotalErrorLogs(errorLogs);
        
        if (!initialLoadDone.current) {
          setSeenErrorLogs(errorLogs);
          initialLoadDone.current = true;
        }
      }
      
      if (tasksRes && typeof tasksRes.pending === 'number') {
        setPendentesTasksCount(tasksRes.pending);
      }
    } catch (e) {
      console.error('Failed to fetch summary data', e);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 15000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  useEffect(() => {
    if (activeTab === 'LOGS') {
      setSeenErrorLogs(totalErrorLogs);
    }
  }, [activeTab, totalErrorLogs]);

  const unseenErrorLogsCount = Math.max(0, totalErrorLogs - seenErrorLogs);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

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
          <button 
            onClick={() => setIsGestaoOpen(!isGestaoOpen)}
            className="flex items-center gap-1.5 px-2 mb-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <p className="text-xs font-bold uppercase tracking-wider">Gestão</p>
            <svg 
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isGestaoOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isGestaoOpen && (
            <div className="space-y-1 pb-4">
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
            onClick={() => setActiveTab('USUARIOS')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'USUARIOS' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Usuários
          </button>

          <button
            onClick={() => setActiveTab('PEDIDOS')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'PEDIDOS' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Pedidos
            </div>
            {pendentesCount > 0 && (
              <span className="bg-orange-500 text-white min-w-[20px] h-[20px] px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold">
                {pendentesCount}
              </span>
            )}
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
            </div>
          )}

          <div className="pt-2">
            <button 
              onClick={() => setIsSistemaOpen(!isSistemaOpen)}
              className="flex items-center gap-1.5 px-2 mb-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <p className="text-xs font-bold uppercase tracking-wider">Sistema</p>
              <svg 
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isSistemaOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {isSistemaOpen && (
            <div className="space-y-1 pb-2">
              <button
                onClick={() => setActiveTab('LOGS')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'LOGS' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1 rounded-lg ${activeTab === 'LOGS' ? 'bg-orange-100' : 'bg-gray-100'} bg-opacity-50`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              Logs da IA (Gemini)
            </div>
            {unseenErrorLogsCount > 0 && (
              <span className="bg-red-500 text-white min-w-[20px] h-[20px] px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold">
                {unseenErrorLogsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('TASKS')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors mt-2 ${
              activeTab === 'TASKS' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1 rounded-lg ${activeTab === 'TASKS' ? 'bg-orange-100' : 'bg-gray-100'} bg-opacity-50`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              Fila de Tasks
            </div>
            {pendentesTasksCount > 0 && (
              <span className="bg-yellow-500 text-white min-w-[20px] h-[20px] px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold">
                {pendentesTasksCount}
              </span>
            )}
          </button>
          </div>
          )}
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
        {activeTab === 'DASHBOARD' && <DashboardTab />}
        {activeTab === 'USUARIOS' && <UsuariosTab />}
        {activeTab === 'PEDIDOS' && <PedidosTab />}
        {activeTab === 'CARDAPIO' && <CardapioTab showToast={showToast} />}
        {activeTab === 'LOGS' && <LogsTab />}
        {activeTab === 'TASKS' && <TasksTab />}
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
    </div>
  );
}

export default App;

