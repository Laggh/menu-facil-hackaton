export function DashboardTab() {
  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Dashboard</h2>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4 mt-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">📊</div>
          <p className="font-medium">Dashboard em construção</p>
          <p className="text-sm text-gray-500">Estatísticas de vendas e acessos aparecerão aqui.</p>
        </div>
      </main>
    </>
  );
}
