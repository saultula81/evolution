# Mapa del Proyecto: Project Manager Bot
Estado: Fase 5 - Trigger (Completado)

## 🌟 Visión del Proyecto (Blueprint)
Este bot gestionará proyectos en `D:\Poyectos` y `e:\evolucion`. 
- **North Star**: App de escritorio para visualizar y lanzar proyectos/servidores con un solo clic.
- **Lógica de Inicio**: Buscar instrucciones en `walkthrough.md` o `package.json` (`scripts.start`).
- **Comportamiento**: Reintentar 3 veces ante fallos, esperar, y si persiste, matar procesos que bloqueen el puerto.
- **Simultaneidad**: El botón de cada proyecto lanza tanto el servidor necesario como la aplicación.

## 📊 Esquema de Datos (Data Schema)

### Project Object
```json
{
  "id": "string",
  "name": "string",
  "path": "string",
  "type": "node | python | docker | other",
  "server_command": "string",
  "status": "online | offline",
  "port": "number"
}
```

### Server Control Payload
```json
{
  "action": "start | stop | restart",
  "projectId": "string"
}
```

## 🛠 Arquitectura A.N.T.

### Capa 1: Architecture
- `architecture/discovery.md`: Lógica para escanear directorios buscando `package.json` o `walkthrough.md`.
- `architecture/process_manager.md`: Protocolo de ejecución con 3 reintentos y manejo de puertos (kill process).
- `architecture/gui_layout.md`: Diseño de la interfaz de escritorio.

### Capa 2: Navigation
- Gestor de estados de los procesos. Orquestación entre el escáner y el lanzador.

### Capa 3: Tools
- `tools/scanner.py`: Escanea `D:\Poyectos` y `e:\evolucion`.
- `tools/launcher.py`: Ejecuta procesos y captura logs.

## 📝 Registro de Mantenimiento (Maintenance Log)
- 2026-02-20: Inicialización del proyecto bajo protocolo B.L.A.S.T.
- 2026-02-20: Implementación completa de la Capa 3 (Tools) y Capa 1 (Architecture).
- 2026-02-20: Creación de `dashboard.py` (Desktop App). Proyecto listo para despliegue local.
- 2026-02-20: [Self-Annealing] Corregido error de importación en `dashboard.py`. Los scripts en `tools/` requieren `sys.path.append` explícito si se ejecutan desde la raíz.
- 2026-02-20: [Self-Annealing] Mejorado el motor de escaneo. Se cambió búsqueda lineal por recursiva (profundidad 2) para detectar proyectos anidados y proyectos web sin `package.json` estándar.
- 2026-02-20: [Self-Annealing] Restaurado el alias `scan_dir` en `tools/scanner.py` para mantener compatibilidad con el Dashboard tras la refactorización recursiva.
