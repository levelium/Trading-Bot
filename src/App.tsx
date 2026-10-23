import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewHero } from './components/OverviewHero';
import { DiagnosticWorkbench } from './components/DiagnosticWorkbench';
import { ConfigGenerator } from './components/ConfigGenerator';
import { DeploymentGuides } from './components/DeploymentGuides';
import { SafetyAudit } from './components/SafetyAudit';
import { TestSuiteViewer } from './components/TestSuiteViewer';
import { FileExplorer } from './components/FileExplorer';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [testResult, setTestResult] = useState<any>(null);
  const [loadingTests, setLoadingTests] = useState<boolean>(false);

  const runTests = async () => {
    setLoadingTests(true);
    try {
      const res = await fetch('/api/run-tests', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error('Failed to run tests:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const handleDownload = () => {
    window.location.href = '/api/download-zip';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownload={handleDownload}
        testPassedCount={testResult?.testCount || 24}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewHero onSelectTab={setActiveTab} />}
        {activeTab === 'diagnostic' && <DiagnosticWorkbench />}
        {activeTab === 'generator' && <ConfigGenerator />}
        {activeTab === 'guides' && <DeploymentGuides />}
        {activeTab === 'safety' && <SafetyAudit />}
        {activeTab === 'tests' && (
          <TestSuiteViewer
            testResult={testResult}
            onRunTests={runTests}
            loading={loadingTests}
          />
        )}
        {activeTab === 'files' && <FileExplorer />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>FvgGold AI Trader v2.20 Production Package</span>
            <span className="text-slate-600">|</span>
            <span>MQL5 & Python Shared Hosting Architecture</span>
          </div>
          <div className="text-slate-400">
            Conservative FVG & Order Block Strategy • Fail-Closed Safeguards Active
          </div>
        </div>
      </footer>
    </div>
  );
}
