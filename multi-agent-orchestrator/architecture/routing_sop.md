# Orchestrator SOP: Message Routing & Synchronization

Este SOP describe cómo sincronizar un solo prompt entre múltiples agentes de IA (ChatGPT, Gemini, Z-Chat).

## 1. El Desafío de Seguridad
Sitios como ChatGPT y Gemini bloquean la carga en `iframes` mediante las cabeceras `X-Frame-Options` y `Content-Security-Policy`.

## 2. Estrategia de Implementación (Architecture)
1. **Navegador Embebido**: Usar una aplicación de escritorio (como Electron o una interfaz de Python con PyWebView) que permita cargar sitios web externos sin restricciones de seguridad.
2. **Sincronización de Prompt**:
   - Detectar los selectores CSS de los campos de entrada de cada agente.
   - Inyectar el valor del prompt principal en cada campo mediante JavaScript.
   - Disparar el evento de teclado (Enter) o hacer clic en el botón de envío de cada panel.

## 3. Lógica de Enrutamiento (tools/sync_tester.py)
1. Iniciar los 3 paneles en paralelo.
2. Esperar a que el usuario escriba el prompt central.
3. Al hacer clic en "Enviar":
   - Copiar el texto al portapapeles o inyectarlo directamente en los DOMs abiertos.
   - Ejecutar la secuencia de envío en cada agente.

## 4. Casos Extremos (Edge Cases)
- **Sesión Expirada**: El sistema debe detectar si un panel muestra la pantalla de login.
- **Diferentes DOMs**: Cada agente tiene selectores diferentes (ej. ChatGPT usa `textarea`, Gemini usa `div[contenteditable]`). Mantener una tabla de selectores actualizada.

## 5. Próximos Pasos
- Inicializar Dashboard con 3 slots de visualización.
- Probar scripts de inyección mediante la consola del navegador.
