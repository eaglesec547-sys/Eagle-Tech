
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, sidebar }) => {
  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      {sidebar && (
        <aside className="w-80 border-r border-slate-800 flex flex-col bg-[#1e293b]/50 backdrop-blur-xl">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">EAGLE TECH</h1>
                <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Infrastructure Analyst</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebar}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[#0f172a]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-[#0f172a]/80 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <span className="text-sm font-medium text-slate-400">Project / Road Inspection v4.0</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-tighter">System Nominal</span>
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
