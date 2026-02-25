const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendPrompt: (prompt) => ipcRenderer.send('orchestrate-prompt', prompt),
  onInjectPrompt: (callback) => ipcRenderer.on('inject-prompt', (_event, value) => callback(value)),
  getPreloadPath: () => ipcRenderer.invoke('get-preload-path')
});

// Confirmación de que el preload está activo en el webview
console.log(`[Orchestrator|Bridge] Preload script activo en: ${window.location.href}`);

// Escuchar IPC desde el proceso principal (Desktop Bridge)
ipcRenderer.on('inject-prompt', (_event, prompt) => {
  console.log(`[Orchestrator|Sync] Recibido prompt vía IPC. Longitud: ${prompt.length}`);
  injectToAgent(prompt);
});

function injectToAgent(prompt) {
  const url = window.location.href;
  let inputField = null;
  let submitButton = null;

  // ChatGPT
  if (url.includes('chatgpt.com')) {
    inputField = document.querySelector('#prompt-textarea');
    submitButton = document.querySelector('button[data-testid="send-button"]');
  }
  // Gemini
  else if (url.includes('gemini.google.com')) {
    inputField = document.querySelector('.ql-editor[contenteditable="true"]') ||
      document.querySelector('div[contenteditable="true"][role="textbox"]');
    submitButton = document.querySelector('button[aria-label*="enviar"]') ||
      document.querySelector('button[aria-label*="send"]') ||
      document.querySelector('.send-button-container button');
  }
  // Z-Chat / Z.ai
  else if (url.includes('z.ai')) {
    inputField = document.querySelector('textarea') || document.querySelector('div[contenteditable="true"]');
    submitButton = document.querySelector('button[type="submit"]') || document.querySelector('.lucide-send')?.parentElement;
  }

  if (inputField) {
    console.log(`[Orchestrator|Sync] Campo detectado. Ejecutando inyección en ${url}...`);

    inputField.focus();

    // Inyección bruta usando execCommand para burlar protecciones de frameworks (React/Vue)
    try {
      if (inputField.tagName === 'DIV' || inputField.getAttribute('contenteditable') === 'true') {
        inputField.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);
        document.execCommand('insertText', false, prompt);
      } else {
        inputField.value = prompt;
      }
    } catch (e) {
      console.error('[Orchestrator|Sync] Error en execCommand, usando fallback:', e);
      inputField.value = prompt;
    }

    // Disparar eventos de control para que el sitio web sepa que hay contenido
    const events = ['input', 'change', 'blur', 'keyup'];
    events.forEach(name => {
      inputField.dispatchEvent(new Event(name, { bubbles: true }));
    });

    // Auto-click con un delay saludable
    setTimeout(() => {
      if (submitButton && !submitButton.disabled) {
        console.log(`[Orchestrator|Sync] Pulsando botón Enviar.`);
        submitButton.click();
        startScraping();
      } else {
        console.log(`[Orchestrator|Sync] Botón enviar no disponible. Intentando Enter.`);
        const enterEvent = new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13
        });
        inputField.dispatchEvent(enterEvent);
        startScraping();
      }
    }, 1200);
  } else {
    console.warn(`[Orchestrator|Sync] No se encontró input field en ${url}. ¿Has iniciado sesión?`);
  }
}

function startScraping() {
  const url = window.location.href;
  let agentId = '';
  if (url.includes('chatgpt.com')) agentId = 'chatgpt';
  else if (url.includes('gemini.google.com')) agentId = 'gemini';
  else if (url.includes('z.ai')) agentId = 'zchat';

  if (!agentId) return; // No scrapeamos la ventana principal

  console.log(`[Orchestrator|Scraper] Iniciando monitoreo para ${agentId}...`);

  // Selectores por agente, de más específico a más genérico
  const SELECTORS = {
    chatgpt: [
      '[data-message-author-role="assistant"] .markdown',
      '.group\\/conversation-turn [data-message-author-role="assistant"] .markdown',
      '.markdown.prose p',
      'article .markdown'
    ],
    gemini: [
      'model-response .markdown',
      'message-content .markdown',
      '.response-content',
      'model-response p',
      'message-content p'
    ],
    zchat: [
      '[data-role="assistant"] .prose',
      '.message--assistant .prose',
      '.chat-message .prose',
      '.prose p',
      '.message-content p'
    ]
  };

  function getLastResponse() {
    const selectors = SELECTORS[agentId] || [];
    for (const selector of selectors) {
      try {
        const items = document.querySelectorAll(selector);
        if (items.length > 0) {
          const text = items[items.length - 1].innerText || items[items.length - 1].textContent;
          if (text && text.trim().length > 20) return text.trim();
        }
      } catch (e) { }
    }
    return '';
  }

  let lastResponse = '';
  let stableCount = 0;
  const maxStable = 3; // 3 segundos estable (más rápido)

  const interval = setInterval(() => {
    const currentResponse = getLastResponse();

    if (currentResponse && currentResponse === lastResponse) {
      stableCount++;
    } else {
      stableCount = 0;
      lastResponse = currentResponse;
    }

    if (stableCount >= maxStable && currentResponse.length > 20) {
      console.log(`[Orchestrator|Scraper] ✅ Respuesta estable en ${agentId} (${currentResponse.length} chars)`);
      ipcRenderer.send('agent-response', { agentId, content: currentResponse });
      clearInterval(interval);
    }
  }, 1000);

  // Timeout de seguridad: 90 segundos — enviar lo que hay aunque sea inestable
  setTimeout(() => {
    clearInterval(interval);
    if (lastResponse && lastResponse.length > 20) {
      console.warn(`[Orchestrator|Scraper] ⚠️ Timeout en ${agentId}. Enviando respuesta parcial.`);
      ipcRenderer.send('agent-response', { agentId, content: lastResponse });
    }
  }, 90000);
}
