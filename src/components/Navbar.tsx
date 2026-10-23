import React from 'react';
import { Download, ShieldCheck, Terminal, Cpu, FileCode2, BookOpen, Activity, AlertCircle } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownload: () => void;
  testPassedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onDownload,
  testPassedCount,
}) => {
  const tabs = [
    { id: 'overview', label: 'Audit & Overview', icon: Activity },
    { id: 'diagnostic', label: 'Live Diagnostic (1003 & 401)', icon: Terminal },
    { id: 'generator', label: 'Token & Config Generator', icon: Cpu },
    { id: 'guides', label: 'Deployment Guides', icon: BookOpen },
    { id: 'safety', label: 'Trading Safety & Risk', icon: ShieldCheck },
    { id: 'tests', label: `Test Suite (${testPassedCount}/24)`, icon: AlertCircle },
    { id: 'files', label: 'Package Files (30)', icon: FileCode2 },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold text-xl">
              G
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-lg tracking-tight">FvgGold AI Trader</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  v2.20 Production
                </span>
              </div>
              <p className="text-xs text-slate-400">MetaTrader 5 EA & Python Shared Hosting Suite</p>
            </div>
          </div>

          {/* Right Action: Download ZIP */}
          <div className="flex items-center space-x-3">
            <a
              href="/api/download-zip"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors shadow-lg shadow-amber-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Download Production ZIP (65 KB)</span>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
