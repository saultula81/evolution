# 🗺️ Project Map: Multi-Agent Orchestrator

## 🚀 Vision (Blueprint)
Crear una aplicación "Universal Prompt" que permita enviar un solo comando a ChatGPT, Gemini y Z-Chat de forma simultánea, centralizando las respuestas en una sola interfaz premium.

## 🛠️ Stack Tecnológico
- **Frontend**: Vite + React (Dashboard Multi-Webview/Iframe).
- **Backend/Automation**: Python/Node scripts para sincronización.
- **Orquestación**: Probable extensión de navegador o aplicación de escritorio (Electron) para bypass de CORS/X-Frame-Options.

## 📋 Discovery Checklist (Phase 1)
- [x] **North Star**: Panel de control "Universal Prompt" con 3 vistas web integradas (Split View).
- [x] **Integraciones**: ChatGPT, Gemini, Z-Chat.
- [x] **Source of Truth**: Almacenamiento local (localStorage) para historial de prompts.
- [x] **Delivery Payload**: Inyección sincronizada de texto en los 3 agentes mediantes disparadores globales.
- [x] **Reglas de Comportamiento**: Modo "Simultáneo" por defecto, gestión de errores mediante logs visuales por panel.

## 📊 Data Schema (Input/Output)
### Input
```json
{
  "prompt": "string",
  "agents": ["chatgpt", "gemini", "z-chat"],
  "sync_type": "parallel"
}
```

### Output
```json
{
  "responses": {
    "chatgpt": "string",
    "gemini": "string",
    "z-chat": "string"
  }
}
```

---
## 📝 Maintenance Log
- **2026-02-21**: Inicio del proyecto. Configuración inicial de B.L.A.S.T.
