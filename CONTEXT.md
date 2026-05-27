# CONTEXT.md: Arquitectura Técnica y Contexto para IAs y Desarrolladores

Este documento contiene las especificaciones técnicas completas del proyecto **AaaS Console (Universal Agent Chassis)**. Está diseñado para servir como manual de referencia rápida para ingenieros de software y agentes de inteligencia artificial (AIs) que necesiten interactuar con el código, comprender los flujos de datos o modificar la lógica de la aplicación.

---

## 🔁 Diagrama de Flujo de Datos (Arquitectura Dinámica)

El siguiente diagrama detalla la inicialización, la sincronización de configuraciones desde Google Sheets y el ciclo de vida de un mensaje enviado por el usuario:

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Cliente as Cliente Web (Vite/index.html)
    participant Hub as Google Sheets (Hub Maestro)
    participant Spoke as Google Sheets (Spoke Agente)
    participant API as Apps Script Web App (API)
    participant LLM as Modelo de IA (Gemini/GPT)

    %% Fase de Arranque
    Usuario->>Cliente: Abre index.html?a=ID
    activate Cliente
    Cliente->>Cliente: Lee ID del agente ("a" o "id")
    Cliente->>Cliente: Inicia executeHandshake()
    
    %% Handshake y Carga de Datos (Hub)
    Cliente->>Hub: GViz Query (Lee Registro de Agentes)
    Hub-->>Cliente: JSON con ID de Plantilla (Spreadsheet ID)
    
    %% Carga de Configuración y Insumos (Spoke)
    Paralelo: Consultas GViz al Spoke
        Cliente->>Spoke: GViz Query (Pestaña 'Config')
        Spoke-->>Cliente: Datos de system_prompt, estética, etc.
        Cliente->>Spoke: GViz Query (Pestaña 'Recursos' o 'Insumos')
        Spoke-->>Cliente: Catálogo de archivos, enlaces y scripts
    end
    
    %% Renderizado Visual
    Cliente->>Cliente: applyVisualConfig() -> Aplica colores y estilos CSS
    Cliente->>Cliente: populateCatalog() -> Renderiza catálogo de recursos
    Cliente->>Cliente: loadSession() -> Recupera chats de localStorage
    Cliente-->>Usuario: Interfaz lista y configurada
    deactivate Cliente

    %% Ciclo de Mensaje
    Usuario->>Cliente: Escribe consulta + adjunta PDF
    activate Cliente
    Cliente->>Cliente: PDF.js procesa PDF en el navegador
    Cliente->>Cliente: Extrae texto seleccionable del PDF
    Cliente->>Cliente: Guarda consulta en el historial local (localStorage)
    
    %% Envío a la API
    Cliente->>API: HTTP POST (Mensaje + Historial + Texto de PDF)
    activate API
    API->>API: Valida apiKey ("uise3t26")
    API->>API: Procesa mensaje y consolida el prompt final
    API->>LLM: Consulta el modelo con system_prompt + historial + archivo
    LLM-->>API: Respuesta de texto del modelo
    API-->>Cliente: JSON { respuesta, tokens }
    deactivate API
    
    %% Renderizado de Respuesta
    Cliente->>Cliente: Traduce etiquetas [[id_recurso]] por tarjetas interactivas
    Cliente->>Cliente: marked.parse() renderiza Markdown en pantalla
    Cliente->>Cliente: Guarda respuesta en localStorage
    Cliente-->>Usuario: Muestra la burbuja del asistente
    deactivate Cliente
```

---

## 🔌 Especificaciones de API y Contrato de Datos

La consola web se comunica con la API de Google Apps Script (declarada en la constante `URL_API`) mediante peticiones AJAX utilizando el método **POST** (con fallback a **GET** si ocurren fallos de CORS).

### 1. Claves Globales del Archivo
*   `URL_API`: `https://script.google.com/macros/s/AKfycbzNxABv8lvXmlkVOnsXMkLqnVMkolZAVv3FBh1rbU2HbZLI8tkk_kMzfg81w-FfYKhB/exec`
*   `SECURITY_KEY` / `apiKey`: `uise3t26` (Debe ir en todas las peticiones al backend).
*   `HUB_SHEET_ID`: `1JzUG-etaANxjlYKQW6jkuRryIwSPbzztNgMMkhHTbB4` (Google Sheet maestro).
*   `correoId` (Defecto): `estudiante@uis.edu.co`

### 2. Contrato de Petición (Payload POST)
Las solicitudes al endpoint de Apps Script se envían en formato JSON encapsulado en un cuerpo de tipo `text/plain` (para evitar restricciones del navegador) con el siguiente formato básico:

```json
{
  "action": "sendMessage",
  "apiKey": "uise3t26",
  "idAgente": "18",
  "correoId": "estudiante@uis.edu.co",
  "mensaje": "Consulta del usuario [[101]]",
  "historial": [
    { "sender": "ai", "text": "Hola, soy DataLens..." },
    { "sender": "user", "text": "Consulta del usuario [[101]]" }
  ]
}
```

#### Parámetros Adicionales cuando hay un Archivo Adjunto (PDF/Imagen)
Cuando el usuario adjunta un archivo, el objeto del payload se expande con los siguientes campos automáticos generados por el cliente web:
*   `tieneArchivo`: `true` (bandera booleana).
*   `textoPdf` / `textoArchivo` / `contenidoDocumento` / `pdfText` / `contenidoArchivo`: Texto plano extraído del PDF por el motor local `pdfjs-dist`.
*   `archivoBase64` / `fileBase64` / `adjuntoBase64` / `documentoBase64`: Contenido del archivo codificado en Base64.
*   `archivoNombre` / `fileName` / `adjuntoNombre` / `documentoNombre`: Nombre original del archivo (ej. `normas.pdf`).
*   `archivoTipo` / `archivoMimeType` / `fileType` / `mimeType`: Tipo MIME del archivo (ej. `application/pdf`).
*   `archivoTamano`: Tamaño del archivo en bytes.
*   `archivo` / `file` / `adjunto`: Cadena Data URL completa del archivo (`data:application/pdf;base64,...`).

### 3. Contrato de Respuesta (Response JSON)
El servidor de Apps Script responde con una cadena que se parsea como JSON.

#### Respuesta a la acción `sendMessage`:
```json
{
  "status": "success",
  "respuesta": "Texto procesado por el LLM incorporando las referencias solicitadas.",
  "tokens": 450
}
```
*   **Nota de Robustez:** Si el Apps Script responde con texto plano directo en lugar de JSON, la función `parseApiResponse()` detectará la anomalía y devolverá el texto íntegro asignándolo a la propiedad `respuesta`, evitando caídas del cliente.

#### Respuesta a la acción `getAppData`:
```json
{
  "status": "success",
  "nombre": "Nombre del Agente",
  "descripcion": "Rol y contexto del agente.",
  "system_prompt": "Prompt estructurado del sistema.",
  "config_visual": {
    "color_primario": "#3b82f6",
    "color_secundario": "#a855f7",
    "logo_url": "https://url.al.logo/img.png",
    "border_radius": "16px"
  },
  "catalogo_recursos": [
    {
      "id_recurso": "101",
      "tipo": "pdf",
      "titulo": "Manual Técnico",
      "descripcion": "Descripción del recurso",
      "url": "https://..."
    }
  ]
}
```

---

## 📊 Estructura de las Hojas de Google Sheets

La comunicación direta del cliente web con las hojas de cálculo se realiza a través de la API GViz de Google (`/gviz/tq`). Las consultas devuelven un formato JSONP que el cargador lee dinámicamente.

### 1. El Hub de Control (Spreadsheet Maestro)
*   **ID:** `1JzUG-etaANxjlYKQW6jkuRryIwSPbzztNgMMkhHTbB4`
*   **Pestaña Consultada:** `gid=0` (Generalmente la primera pestaña, llamada `Agentes`).
*   **Mapeo de Datos:** El código de la consola busca y normaliza las siguientes columnas:
    *   `Id_Agente` / `id_agente` / `id`: Identificador numérico o de texto del agente (ej. `18`, `AaaS-HOMERO-v5`).
    *   `Nombre` / `name`: Nombre descriptivo del agente.
    *   `IdPlantilla` / `id_plantilla`: El ID de la hoja de cálculo de Google que actúa como Spoke del agente.
    *   `Estado` / `status`: Debe ser "Activo" (se normaliza y compara en minúsculas).
    *   `Descripcion` / `descripcion` / `comentario`: Breve reseña del agente que se despliega en la barra lateral.

### 2. El Spoke de cada Agente (Spreadsheet del Agente)
Cada agente posee su propio Spreadsheet (`IdPlantilla`). Para que el handshake funcione, la hoja de cálculo debe contener las siguientes pestañas:

#### Pestaña `Config`
Almacena pares clave-valor. La tabla GViz debe contener dos columnas principales: una para la **Clave** (key) y otra para el **Valor** (value).
*   **Claves críticas esperadas:**
    *   `nombre_agente`: El nombre oficial del agente.
    *   `system_prompt`: El prompt de sistema que define la personalidad y límites del agente.
    *   `interfaz`: Cadena en formato JSON que especifica el tema visual:
        ```json
        {
          "estetica": {
            "colores": {
              "primario": "#3b82f6",
              "secundario": "#a855f7"
            },
            "bordesRedondeados": "16px"
          },
          "disposicion": {
            "cabecera": {
              "urlLogo": "https://..."
            }
          }
        }
        ```

#### Pestaña de Recursos (Nombres soportados: `InsumosPa_IA_UI`, `Insumos`, `Recursos`, `Catalogo`, `Catálogo`)
Contiene los insumos que el agente utiliza para responder o que el usuario puede enlazar en el chat.
*   **Columnas esperadas:**
    *   `Id_Recurso` / `id_recurso` / `id`: Identificador del recurso (ej. `101`).
    *   `Tipo` / `type`: Tipo de recurso. El parser lo normaliza a las categorías: `pdf`, `video`, `image`, `sheet`, `code`, o `link`.
    *   `Url` / `url` / `link`: Dirección de acceso al recurso (Google Docs, PDF en la nube, etc.).
    *   `Descripcion` / `descripcion` / `description`: Explicación de lo que contiene el archivo.
    *   `Estado` / `status`: Debe estar configurado como "Activo".

---

## 🧠 Características Lógicas Avanzadas y State Management

### 1. Motor de Persistencia (Conversaciones)
Las conversaciones se persisten localmente en el `localStorage` del navegador para evitar la pérdida de chats durante recargas.
*   **Llave de Almacenamiento:** `AaaS_sessions_list_v4_[ID_DEL_AGENTE]`
*   **Estructura del Almacenamiento:** Un array de objetos de sesión:
    ```javascript
    [
      {
        "id": "1685324567000", // Timestamp único
        "date": "27/5/2026 08:39:00",
        "messages": [
          { "sender": "ai", "text": "Hola..." },
          { "sender": "user", "text": "Hola..." }
        ]
      }
    ]
    ```
*   **Sincronización:** Cada vez que se envía un mensaje o se recibe una respuesta, el array de mensajes de la sesión activa se actualiza y se escribe inmediatamente en el `localStorage`.

### 2. Conversión de Archivos Adjuntos y PDF.js
Cuando se carga un PDF en el campo `<input type="file">`, el cliente:
1.  Usa `FileReader.readAsDataURL` para obtener una cadena Base64 y una URI representativa.
2.  Si es un PDF, inicia una importación dinámica de la biblioteca **PDF.js** desde la CDN de UNPKG (`pdfjs-dist@4.10.38`).
3.  Carga el documento binario en memoria a través de un búfer de bytes (`Uint8Array`).
4.  Itera por las primeras 30 páginas del PDF, extrayendo los fragmentos de texto seleccionable y consolidándolos en una sola cadena formateada (`Página 1: [texto] ...`).
5.  Si el PDF no contiene texto (es un escaneo puro), captura el fallo y rellena el campo `extractionError` para que el backend decida si procesar el binario directamente.

### 3. Parser de Etiquetas Multimedia (`[[id]]`)
Cuando el LLM retorna una respuesta que incluye referencias en formato de corchetes dobles (por ejemplo, `verificado en [[101]]`), la función `translateMultimediaTags(text)` del cliente web:
1.  Busca el token `101` dentro de la variable global de catálogo `catalogoRecursos`.
2.  Si el recurso existe, reemplaza la etiqueta `[[101]]` con un componente HTML diseñado (Card premium) que incluye el icono del tipo de archivo (PDF, Hoja de cálculo, etc.), el título del insumo, la descripción y un botón de llamada a la acción para abrir la URL externa del recurso en una nueva pestaña.
3.  Si no existe, renderiza una caja de advertencia punteada indicando que la ID del recurso no pertenece a ese agente.

### 4. Lógica de Resiliencia y Fallback Offline
Si falla la llamada HTTP a `callAaaS_API()`, el sistema no se detiene:
*   **En la fase de Handshake:** Lanza un bloque `try-catch` y recurre a `loadAppDataFromSheets()`. Esta función realiza consultas GViz directas a la API de Google Sheets saltándose la API intermedia de Apps Script. Extrae los datos estéticos y de recursos del Google Sheet original y los monta en memoria.
*   **En el Chat:** Si el usuario envía un mensaje y la API está caída o bloqueada por CORS, la consola llama a `buildLocalAgentResponse()`, la cual genera una respuesta automatizada utilizando las reglas del agente configuradas en el Spreadsheet y lista los recursos cargados en el catálogo local para simular la interacción.

---

## 🤖 Guía y Directrices para IAs al Modificar este Código

Si eres una Inteligencia Artificial encargada de añadir características, depurar o actualizar este código, sigue estrictamente estas directrices de arquitectura:

1.  **Mantén la Estructura Monolítica Eficiente de index.html:** Toda la lógica del cliente activo (HTML, CSS dinámico y Vanilla JS) está intencionalmente contenida en `index.html`. No separes la lógica en múltiples archivos `.js` o `.css` a menos que el usuario lo solicite explícitamente, ya que esto podría romper el despliegue estático de Vite o la distribución final en producción.
2.  **No Modifiques app.js ni style.css Inadvertidamente:** Si tus cambios modifican la interfaz de chat de la consola principal, realiza los ajustes directamente dentro de los bloques `<style>` y `<script>` de `index.html`. `app.js` y `style.css` pertenecen a un prototipo de panel heredado y no deben alterarse a menos que se te pida explícitamente corregir ese panel alternativo.
3.  **Preserva las Rutas de Datos y Llaves de Seguridad:** No alteres el valor de `SECURITY_KEY` ("uise3t26"), `HUB_SHEET_ID` ("1JzUG-etaANxjlYKQW6jkuRryIwSPbzztNgMMkhHTbB4") o la lógica de enrutamiento basada en el parámetro URL `a` y el fallback `id`.
4.  **Respeta el Sistema de Fallbacks:** Cualquier mejora en la conexión de la API o la comunicación de red debe preservar el bloque de recuperación `loadAppDataFromSheets` y las simulaciones locales de respuesta. Esto asegura que la interfaz siempre sea interactiva incluso en condiciones locales sin red.
5.  **Utiliza el Formato de Enlaces Clickables:** Cuando modifiques o agregues código, recuerda usar enlaces markdown clickables con esquema `file://` para facilitar la navegación a los archivos modificados (ej: [index.html](file:///c:/Users/danna/Desktop/pruebas2/agentesAaaS/index.html)).
