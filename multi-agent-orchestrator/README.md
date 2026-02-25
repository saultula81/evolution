# Multi-Agent Prompt Orchestrator

Universal Orchestrator for simultaneous prompt injection into ChatGPT, Gemini, and Z-Chat.

## 🚀 Vision
A premium dashboard designed to centralize AI interactions. Write once, orchestrate everywhere.

## 📂 Project Structure
- `architecture/`: Routing SOPs and design decisions.
- `frontend/`: React + Vite dashboard.
- `tools/`: Python sync & handshake utilities.

## 🛠️ Setup
1. Navigate to `frontend/`.
2. Run `npm install`.
3. Run `npm run dev`.

## 📡 Sync Logic
The system uses DOM injection patterns defined in `architecture/routing_sop.md`. For standard browsers, sync is simulated; for the native desktop bridge (Electron/PyWebView), full injection is enabled.
