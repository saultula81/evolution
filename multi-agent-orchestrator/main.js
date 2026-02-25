const { app, BrowserWindow, ipcMain, webContents } = require('electron');
const path = require('path');
const orchestrator = require('./orchestrator');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Multi-Agent Orchestrator",
    backgroundColor: '#050505',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  // Si estamos en producción, cargamos el index.html local
  if (app.isPackaged || process.env.NODE_ENV === 'production') {
    win.loadFile(path.join(__dirname, 'index.html'));
  } else {
    win.loadURL('http://localhost:5174');
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Bridge para la ruta del preload
ipcMain.handle('get-preload-path', () => {
  const p = path.join(__dirname, 'preload.js');
  console.log(`[Main] Solicitud de preload path: ${p}`);
  return p;
});

// Estado global para el Consenso
let consensusStore = {
  active: false,
  originalPrompt: '',
  responses: {} // { agentId: content }
};

// Bridge de Orquestación Universal
ipcMain.on('orchestrate-prompt', async (event, prompt) => {
  console.log(`[Main] Orquestando prompt para todos los contenidos.`);

  const enhancedPrompt = await orchestrator.enhancePrompt(prompt);

  // Detectar inicio de consenso
  if (prompt.includes('/consenso')) {
    consensusStore = {
      active: true,
      originalPrompt: prompt.replace('/consenso', '').trim(),
      responses: {}
    };
    console.log(`[Main|Consenso] Iniciando workflow de consenso para: ${consensusStore.originalPrompt}`);
  }

  const allWebContents = webContents.getAllWebContents();

  allWebContents.forEach((wc) => {
    wc.send('inject-prompt', enhancedPrompt);
  });
});

// Listener para respuestas de agentes
ipcMain.on('agent-response', async (event, { agentId, content }) => {
  if (!consensusStore.active) return;
  if (consensusStore.responses[agentId]) return; // evitar duplicados

  console.log(`[Main|Consenso] ✅ Respuesta recibida de ${agentId} (${content.length} chars).`);
  consensusStore.responses[agentId] = content;

  const agentsCount = Object.keys(consensusStore.responses).length;
  console.log(`[Main|Consenso] Progreso: ${agentsCount}/3 agentes.`);

  // Activar al Juez cuando tenemos al menos 2 de 3 respuestas
  if (agentsCount >= 2) {
    consensusStore.active = false;
    console.log(`[Main|Consenso] ⚖️ Suficientes respuestas. Activando al Juez...`);

    const judgePrompt = `/juez-consenso\n\nPROMPT ORIGINAL: ${consensusStore.originalPrompt}\n\nRESPUESTAS:\n` +
      Object.entries(consensusStore.responses)
        .map(([id, text]) => `--- AGENTE: ${id} ---\n${text}\n`)
        .join('\n');

    const enhancedJudgePrompt = await orchestrator.enhancePrompt(judgePrompt);

    const allWebContents = webContents.getAllWebContents();
    allWebContents.forEach((wc) => {
      wc.send('inject-prompt', enhancedJudgePrompt);
    });
  }
});
