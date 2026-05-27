# Ecosistema de Agentes Inteligentes (AaaS)
### Consola Universal y Chasis de Agentes

Esta es la consola de usuario e interfaz de control para el ecosistema **AaaS (Agent as a Service)**. El sistema permite orquestar de forma dinámica múltiples agentes de inteligencia artificial especializados a través de una arquitectura distribuida de hojas de cálculo de Google (Hub-Spoke) y una API intermedia en Google Apps Script.

---

## 🗺️ Arquitectura del Sistema

El ecosistema se organiza bajo un modelo descentralizado de tres capas:

```
               ┌────────────────────────────────────────────────────────┐
               │         Consola Universal AaaS (Vite / HTML5)          │
               │   - Panel de Chat e Historial Local (localStorage)     │
               │   - Extracción de PDF con PDF.js y entrada por voz     │
               └───────────┬────────────────────────────────┬───────────┘
                           │ (Fetch POST/GET JSON API)      │
                           │                                │ (Google Sheets GViz API)
                           ▼                                ▼ (Fallback / Handshake)
  ┌────────────────────────────────────────────────┐  ┌────────────────────────────────────────────────┐
  │         Google Apps Script Middleware          │  │     Google Sheets Hub (Directorio Central)     │
  │   - CORS proxy & Handshake Handler             │  │  - Registro de Agentes Activos (Id, Nombre...) │
  │   - Envío de consultas al modelo de lenguaje   │  │  - IdPlantilla (Spreadsheet de cada Spoke)     │
  └────────────────────────┬───────────────────────┘  └────────────────────────────────────────────────┘
                           │
                           ▼
  ┌────────────────────────────────────────────────┐
  │     Spoke del Agente (Spreadsheet Asignada)    │
  │  - Config: System Prompt y Estética Personal   │
  │  - Recursos / Catálogo: Archivos y enlaces     │
  └────────────────────────────────────────────────┘
```

1. **Directorio Central (Hub):** Una hoja de cálculo maestra (`HUB_SHEET_ID`) que lista todos los agentes registrados en el sistema, su estado (activo/inactivo), y el identificador de su hoja de cálculo asociada (`IdPlantilla`).
2. **Plantilla de Agente (Spoke):** Cada agente cuenta con una hoja de cálculo dedicada (Spoke) que almacena su configuración (`Config`), incluyendo el prompt del sistema (`system_prompt`), nombre oficial, y su biblioteca personal de recursos (`Recursos` o `Catalogo`).
3. **Middleware (Google Apps Script Web App):** Funciona como la API de comunicación. Recibe consultas del cliente web, valida la clave de seguridad (`SECURITY_KEY`), carga los datos del agente, y realiza la consulta con el modelo de lenguaje de IA para retornar la respuesta.
4. **Cliente de Consola (Este repositorio):** Una interfaz web premium basada en Tailwind CSS que se adapta visualmente al agente cargado (colores, logotipos, radios de borde) y gestiona la sesión del usuario.

---

## 📂 Organización de Archivos en el Repositorio

El proyecto está organizado de la siguiente manera:

*   **[index.html](file:///c:/Users/danna/Desktop/pruebas2/agentesAaaS/index.html):** Aplicación principal del ecosistema. Contiene toda la maquetación (Tailwind CSS vía CDN, animaciones, componentes interactivos), el motor lógico de Javascript (Handshake, sincronización del Hub, carga de recursos, almacenamiento local de historial de chat, dictado por voz y extracción de texto de PDFs) y los estilos CSS dinámicos en una hoja interna.
*   **[app.js](file:///c:/Users/danna/Desktop/pruebas2/agentesAaaS/app.js):** Módulo de interfaz heredado / prototipo. Contiene la lógica para una vista de panel (dashboard) alternativa con diagramas de flujo SVG interactivos, temporizadores simulados y controles para un iframe que embebe directamente la Web App de Apps Script. *Nota: Este archivo no está importado en la interfaz actual de chat, pero se mantiene en el repositorio como referencia de diseño.*
*   **[style.css](file:///c:/Users/danna/Desktop/pruebas2/agentesAaaS/style.css):** Hoja de estilos complementaria correspondiente al panel de control heredado (`app.js`). Define las animaciones y contenedores para el diseño de bloques, orbes brillantes flotantes y acordeones instructivos. *Nota: No es importada por `index.html`, la cual cuenta con sus propios estilos incrustados.*
*   **[test_fetch.js](file:///c:/Users/danna/Desktop/pruebas2/agentesAaaS/test_fetch.js):** Script ligero de Node.js / navegador para realizar pruebas de conectividad rápida y handshake manual con el backend de Google Apps Script.
*   **[package.json](file:///c:/Users/danna/Desktop/pruebas2/agentesAaaS/package.json) y [package-lock.json](file:///c:/Users/danna/Desktop/pruebas2/agentesAaaS/package-lock.json):** Archivos de configuración de Node.js. Define a **Vite** como servidor de desarrollo y las dependencias necesarias.
*   **[dist/](file:///c:/Users/danna/Desktop/pruebas2/agentesAaaS/dist):** Carpeta que contiene la versión compilada y optimizada para producción generada por Vite.

---

## ⚡ Características Principales del Cliente

*   **Handshake Inteligente:** Al iniciar o cambiar de agente (parámetro de URL `?a=ID`), la consola consulta al Hub el `IdPlantilla` del Spoke, lee la configuración estética y de comportamiento directamente de la pestaña `Config` y reconstruye la interfaz web.
*   **Temas Estéticos Dinámicos:** La consola altera sus variables CSS `--color-primary`, `--color-secondary` y el radio de los paneles en tiempo de ejecución de acuerdo a los valores guardados en el Google Sheet del Spoke.
*   **Catálogo de Recursos Integrado:** Muestra los insumos registrados para el agente (PDFs, manuales, hojas de cálculo, APIs). Al hacer clic en un recurso, se inyecta su token correspondiente (ej. `[[101]]`) en la caja de texto para que el modelo de IA lo integre en su análisis.
*   **Extracción de PDF Local (Client-Side):** Permite subir archivos PDF locales. La interfaz utiliza **PDF.js** en el navegador para extraer el texto y enviarlo estructurado dentro del prompt, eludiendo la necesidad de subir archivos pesados al Apps Script.
*   **Dictado por Voz:** Integra la API de reconocimiento de voz del navegador (`SpeechRecognition`) para escribir consultas dictando con el micrófono.
*   **Historial Local Multisesión:** Almacena de forma segura las conversaciones agrupadas por agente en el `localStorage` del navegador, permitiendo crear, cambiar y eliminar chats previos sin depender de bases de datos externas.
*   **Lógica de Fallback Resiliente:** Si el endpoint de Apps Script falla debido a configuraciones de red, el cliente activa una consulta GViz directa a Google Sheets para obtener los recursos y simula respuestas básicas de agente de forma local para garantizar que la interfaz siga funcionando.

---

## 🚀 Instalación y Desarrollo Local

Sigue estos pasos para levantar el entorno de desarrollo en tu computadora local:

1.  **Clona el repositorio** en tu máquina de desarrollo.
2.  **Instala las dependencias** de desarrollo (Vite):
    ```bash
    npm install
    ```
3.  **Inicia el servidor de desarrollo local**:
    ```bash
    npm run dev
    ```
4.  **Abre tu navegador** en la dirección indicada por la consola (generalmente `http://localhost:5173`).
5.  **Selecciona un Agente:** Para cambiar de agente, añade el identificador en la barra de direcciones, por ejemplo:
    *   `http://localhost:5173/?a=1` (Asesor de Patentes)
    *   `http://localhost:5173/?a=18` (DataLens)

Para compilar la aplicación para distribución en producción:
```bash
npm run build
```
Esto generará los archivos finales en la carpeta `dist/`.

---

## 🔧 Solución de Problemas (Troubleshooting) y CORS

Al trabajar en desarrollo local (`localhost`), es común enfrentar dos barreras debido a las políticas de seguridad de Google y del navegador:

### 1. El backend de Google Apps Script solicita inicio de sesión
*   **Síntoma:** El indicador del estado de la API muestra `SIN CONEXIÓN` o `AUTH REQUERIDA` y el bot responde con un cuadro de error.
*   **Causa:** El script de Google está configurado para ejecutarse bajo la cuenta del usuario activo y no ha recibido autorización inicial.
*   **Solución:** Haz clic en el enlace seguro provisto por la consola (o abre la URL de `URL_API` directamente en el navegador), inicia sesión con tu cuenta institucional o de Google y concede los permisos requeridos. Luego, regresa a tu consola local y recarga.

### 2. Bloqueo de CORS (Cross-Origin Resource Sharing)
*   **Síntoma:** Las consultas al chat fallan silenciosamente o muestran un error de red en la consola del navegador.
*   **Causa:** Google Apps Script no añade cabeceras CORS permisivas a los scripts publicados en modo de desarrollo cuando la consulta procede de un host ajeno como `localhost`.
*   **Solución:** 
    *   Instala una extensión de navegador de control de CORS (como **Allow CORS: Access-Control-Allow-Origin** para Chrome) y actívala durante tus sesiones de desarrollo.
    *   O bien, ejecuta el navegador con la seguridad web deshabilitada para depuración (ej: `chrome.exe --disable-web-security --user-data-dir="C:/tmp"`).
