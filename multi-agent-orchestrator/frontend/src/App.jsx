import React, { useState, useEffect } from 'react';
import { Send, Layout, Cpu, Globe, Terminal, Zap, ExternalLink, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AGENTS = [
  { id: 'zchat', name: 'Z-Chat', url: 'https://chat.z.ai/', color: '#6366f1' },
  { id: 'gemini', name: 'Google Gemini', url: 'https://gemini.google.com/u/1/app?hl=es&pageId=none', color: '#4285f4' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', color: '#10a37f' }
];

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [preloadPath, setPreloadPath] = useState('');
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('prompt_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // Obtener la ruta absoluta del preload para que los webviews lo encuentren
    if (window.electronAPI && window.electronAPI.getPreloadPath) {
      window.electronAPI.getPreloadPath().then(path => {
        console.log(`[Dashboard] Preload path cargado: ${path}`);
        setPreloadPath(path);
      });
    }
  }, []);

  const handleSend = () => {
    if (!prompt.trim()) return;

    setIsSending(true);

    // Almacenar en historial
    const newHistory = [prompt, ...history.slice(0, 9)];
    setHistory(newHistory);
    localStorage.setItem('prompt_history', JSON.stringify(newHistory));

    // Comunicación con el Desktop Bridge para disparo global
    if (window.electronAPI) {
      console.log(`[Dashboard] Orquestando prompt global: ${prompt.substring(0, 20)}...`);
      window.electronAPI.sendPrompt(prompt);
    } else {
      console.log(`🚀 Modo Web (Simulado): ${prompt}`);
    }

    setTimeout(() => {
      setIsSending(false);
    }, 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-deep">
      {/* Dynamic Grid Layout */}
      <div className="dashboard-grid grid-cols-1 md:grid-cols-3">
        {AGENTS.map((agent) => (
          <div key={agent.id} className="agent-panel border-r border-border">
            <div className="panel-header group flex justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: agent.color }}></div>
                <span>{agent.name}</span>
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity text-dim hover:text-white">
                <ExternalLink size={12} />
              </button>
            </div>

            <div className="agent-iframe-container bg-panel relative">
              {window.electronAPI && preloadPath ? (
                <webview
                  src={agent.url}
                  className="w-full h-full"
                  preload={preloadPath}
                  useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
                  webpreferences="contextIsolation=yes, nodeIntegration=no, sandbox=no"
                />
              ) : (
                <div className="empty-state">
                  {!preloadPath && window.electronAPI ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] uppercase font-bold text-accent">Cargando Bridge...</p>
                    </div>
                  ) : (
                    <>
                      <Globe size={48} className="mb-4" />
                      <p className="text-xs uppercase tracking-widest">{agent.url}</p>
                    </>
                  )}
                </div>
              )}

              {/* Overlay de Sincronización */}
              <AnimatePresence>
                {isSending && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-accent bg-opacity-5 backdrop-blur-[2px] flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center">
                      <Zap className="text-accent animate-pulse mb-2" size={24} />
                      <span className="text-[10px] text-accent font-bold uppercase tracking-[0.2em]">Inyectando Prompt...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Prompt Orchestrator Bar */}
      <div className="prompt-bar">
        <div className="flex flex-col gap-1 min-w-[120px]">
          <span className="text-[10px] font-bold text-dim uppercase tracking-[0.2em]">Capa de Control</span>
          <div className="flex gap-2">
            <Settings size={14} className="text-dim hover:text-white cursor-pointer" />
            <Terminal size={14} className="text-dim hover:text-white cursor-pointer" />
          </div>
        </div>

        <div className="relative flex-1 group">
          <input
            type="text"
            placeholder="Escribe tu prompt universal aquí..."
            className="prompt-input w-full"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
            {history.length > 0 && (
              <span className="text-[10px] bg-white bg-opacity-5 px-2 py-1 rounded text-dim border border-white border-opacity-5">
                V{history.length}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={isSending || !prompt.trim()}
          className="btn-send disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <span>Enviando</span>
            </div>
          ) : (
            <>
              <span>Orquestar</span>
              <Send size={18} />
            </>
          )}
        </button>
      </div>

      <style>{`
        .h-screen { height: 100vh; }
        .h-full { height: 100%; }
        .w-full { width: 100%; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .bg-deep { background: #050505; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        @media (min-width: 768px) { .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .border-r { border-right-width: 1px; }
        .border-border { border-color: rgba(255, 255, 255, 0.08); }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .gap-2 { gap: 0.5rem; }
        .gap-1 { gap: 0.25rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .opacity-50 { opacity: 0.5; }
        .cursor-not-allowed { cursor: not-allowed; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default App;
