import React, { useState, useEffect } from 'react';
import { FileCode, Folder, Download, Eye, FileText, Check, Copy } from 'lucide-react';

export const FileExplorer: React.FC = () => {
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('FvgGold-EA-main/FvgGold.mq5');
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/file-tree')
      .then((res) => res.json())
      .then((data) => {
        if (data.tree) setFileTree(data.tree);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedFilePath) {
      setLoadingFile(true);
      fetch(`/api/view-file?path=${encodeURIComponent(selectedFilePath)}`)
        .then((res) => res.json())
        .then((data) => {
          setFileContent(data.content || '');
        })
        .catch(console.error)
        .finally(() => setLoadingFile(false));
    }
  }, [selectedFilePath]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderTree = (items: any[], depth = 0) => {
    return (
      <div className="space-y-1">
        {items.map((item, idx) => (
          <div key={idx}>
            {item.isDirectory ? (
              <div>
                <div className="flex items-center space-x-1.5 py-1 px-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/40 rounded cursor-default">
                  <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{item.name}</span>
                </div>
                <div className="pl-4 border-l border-slate-800 ml-2">
                  {renderTree(item.children, depth + 1)}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSelectedFilePath(item.path)}
                className={`w-full flex items-center justify-between py-1 px-2 text-xs rounded transition-colors text-left ${
                  selectedFilePath === item.path
                    ? 'bg-amber-500/15 text-amber-300 font-medium border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 ml-2 shrink-0">
                  {item.size ? `${(item.size / 1024).toFixed(1)}k` : ''}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Complete Deliverable Package (30 Files)</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Browse the repaired MQL5 source code, Python WSGI service, SQL schemas, tests, and deployment guides.
          </p>
        </div>
        <a
          href="/api/download-zip"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download Package ZIP (65 KB)</span>
        </a>
      </div>

      {/* Explorer Split Pane */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Tree */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-[650px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Package File Tree
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              v2.20
            </span>
          </div>
          {fileTree.length > 0 ? (
            renderTree(fileTree)
          ) : (
            <p className="text-xs text-slate-500">Loading files...</p>
          )}
        </div>

        {/* Right Code Viewer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:col-span-2 flex flex-col max-h-[650px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <span className="text-xs font-mono font-bold text-amber-300 truncate">
              {selectedFilePath}
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-auto">
            {loadingFile ? (
              <p className="text-xs text-slate-500">Loading file content...</p>
            ) : (
              <pre className="text-xs font-mono text-slate-300 whitespace-pre leading-relaxed select-all">
                {fileContent}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
