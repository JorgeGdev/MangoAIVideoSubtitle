# 🎬 MangoAI Video Subtitle Generator

Generador avanzado de subtítulos estilo karaoke que combina **OpenAI Whisper**, **FFmpeg** y **Node.js** para crear videos con subtítulos quemados (burned-in) y efectos de transición profesionales con crossfade automático.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-6.0+-blue.svg)](https://ffmpeg.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Whisper-orange.svg)](https://openai.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

## 🚀 Características Principales

- 🎥 **Video con subtítulos karaoke quemados** (estilo Montserrat profesional)
- 📄 **Múltiples formatos de exportación** (TXT, Markdown, transcripción completa)
- 🎭 **Crossfade automático** con video outro y transición suave
- 🤖 **OpenAI Whisper** para transcripción automática de alta precisión
- 🎨 **Diseño minimalista** con UI moderna y responsiva
- ⚡ **Procesamiento optimizado** para videos de 10-30 segundos
- 🔄 **Pipeline automatizado** desde upload hasta descarga
- 🎯 **Escalado inteligente** que se adapta a cualquier formato de video
- � **Burn-in profesional** con configuración avanzada de estilos
- 📱 **Compatibilidad universal** (yuv420p para web/móvil)

## 🏗️ Arquitectura Completa del Proyecto

```
📦 MangoAIVideoSubtitle/
├── 🚀 server.js                    # Servidor Express principal
├── 📋 package.json                 # Dependencias y configuración NPM
├── 🔧 nodemon.json                 # Configuración de desarrollo con hot reload
├── 🐳 Dockerfile                   # Contenedorización para despliegue
├── 🚂 railway.json                 # Configuración específica de Railway
├── 🌍 .env                         # Variables de entorno (LOCAL - NO SUBIR)
├── 📄 .env.example                 # Plantilla de variables de entorno
├── 📁 public/                      # Frontend estático
│   ├── 🏠 index.html              # Interfaz principal de usuario
│   ├── 🎨 styles.css              # Estilos CSS modernos y responsivos
│   ├── ⚡ app.js                   # Lógica del cliente JavaScript
│   └── 📂 assets/
│       └── 🎬 outro.mp4           # Video outro para transiciones automáticas
├── 🛣️ routes/
│   └── 🔀 jobs.js                  # API endpoints y lógica de procesamiento
├── ⚙️ services/                    # Módulos especializados de procesamiento
│   ├── 🎙️ transcriber.js          # Integración con OpenAI Whisper
│   ├── 📄 ass-builder.js          # Generación avanzada de archivos .ASS
│   ├── 📝 text-exporter.js        # Exportación múltiple de formatos
│   ├── 🔥 burner.js                # Burn-in de subtítulos con FFmpeg
│   └── 🎭 outro.js                 # Crossfade y transiciones profesionales
├── 🔤 fonts/                       # Fuentes personalizadas para subtítulos
├── 📂 tmp/                         # Archivos temporales (auto-limpieza)
│   ├── 🎬 *.mp4                   # Videos procesados y finales
│   ├── 📄 *.ass                   # Archivos de subtítulos ASS
│   ├── 📝 *.txt                   # Subtítulos en formato texto
│   └── 📊 *.words.json            # Datos de transcripción detallados
└── 📖 README.md                    # Documentación completa (este archivo)
```

Contratos (sin código, para que me confirmes)
1) Endpoint principal

POST /api/subtitle (form-data)

file: MP4 ≤10 MB.

style (opcional, JSON en cadena):

{
  "font": "Montserrat",
  "fontSize": 60,
  "primary": "&H00FFFFFF&",
  "outline": 3,
  "shadow": 0,
  "align": 2,
  "marginV": 60
}


Respuesta (200 OK)

Éxito inmediato con descarga: { "status":"done", "downloadUrl": "/api/subtitle/:id/download" }

O bien con pequeño polling si prefieres: { "status":"processing", "id":"..." } + GET /api/subtitle/:id/status

(Para clips de 18–30 s y archivos de ≤10 MB, podemos hacerlo en una sola llamada y devolver el MP4 final en la misma respuesta como stream. Si te gusta más simple, lo hacemos “sin jobs”.)

2) Descarga

GET /api/subtitle/:id/download
Devuelve el MP4 1080p con subtítulos quemados.

3) Health

GET /health → { ok: true }

Flujo interno (backend)

Upload con Multer (rechaza >10 MB, MIME distinto a video/mp4).

Extract audio con FFmpeg (a WAV o MP3).

ASR (Whisper) via OpenAI para segmentos y palabras (solo inglés).

ASS: construir un archivo .ass “karaoke” con \k y estilo Montserrat configurable.

Burn-in con FFmpeg: -vf subtitles=subs.ass, -vf scale=-2:1080 si hace falta, -crf 23, -c:a copy.

Responder el MP4 final (y limpiar tmp/).

Frontend mínimo

index.html: campo para MP4, botón “Render”.

app.js: hace fetch al POST /api/subtitle, muestra progreso básico y, al terminar, coloca un link de descarga.

styles.css: tema negro + morado con degradé (sencillo, sin emojis).

Variables de entorno

OPENAI_API_KEY (en .env y en Railway).

Si quieres, PORT y TMP_DIR opcionales.

Checklist de aceptación

 Solo Node + HTML/CSS/JS (sin Python).

 MP4 ≤10 MB validado.

 Inglés como idioma esperado.

 Montserrat por defecto, estilo editable.

 1080p CRF 23, downscale si input >1080p.

 Una página minimal.

 Sin colas (respuesta directa) o con job si prefieres polling.


 DESARROLLO DEL SOFTWARE


 Subtitles Karaoke

Web sencilla hecha con Node.js + Express y FFmpeg que:
recibe un MP4 corto (18 a 30 s, máximo 10 MB),
genera subtítulos tipo karaoke a partir del audio con Whisper (OpenAI),
construye un archivo .ASS con bloques línea por línea y efecto \k,
quema los subtítulos en el video con FFmpeg,
entrega un MP4 1080p final.
Estilo por defecto: Montserrat, texto blanco con contorno negro y sombra sutil, alineado al centro inferior pero con margen elevado para no pegarse al borde. Todo es configurable.
Tabla de contenido
Objetivos
Stack y razones
Estructura de carpetas
Qué hace cada archivo
Instalación y requisitos
Ejecución local
Uso desde el navegador
API
Cómo funciona por dentro
Algoritmo de segmentación karaoke
Escalado de tipografía y margen vertical
Límites, calidad y rendimiento
Dependencias principales
Retos y soluciones
Configurar estilos
Notas de seguridad
Despliegue en Railway
Mejoras futuras
Licencia
Objetivos
Producir un video final con subtítulos karaoke word by word.
Mantener el proyecto simple: solo HTML, CSS y JS en frontend, Node.js en backend.
Ser barato y estable. Para clips cortos, Whisper API es suficiente y simple. Alternativas locales se pueden integrar después.
UX minimalista: subir un MP4, presionar Start, descargar el MP4 subtitulado.
Stack y razones
Node.js + Express: fácil de correr en cualquier Windows, macOS o Linux, y en Railway con un Docker básico o build automático.
Multer: subida de archivos con validación de tamaño y tipo.
FFmpeg: quemado de subtítulos con libass y downscale a 1080p.
fluent-ffmpeg: capa cómoda para invocar FFmpeg en Node.
OpenAI Whisper API: transcripción confiable y simple para inglés. Devuelve segmentos con timestamps. Si no hay palabras nativas, distribuimos tiempos por palabra dentro de cada segmento.
ASS: formato de subtítulos con poder para karaoke (\k), estilos, márgenes y alineación.
Estructura de carpetas
subtitles-karaoke/
  public/
    index.html
    styles.css
    app.js
  routes/
    jobs.js
  services/
    transcriber.js
    ass-builder.js
    burner.js
  tmp/                 # archivos temporales (input.mp4, out.mp4, .ass, .json)
  fonts/               # opcional si quieres gestionar fuentes localmente
  server.js
  package.json
  nodemon.json
  .env                 # NO lo subas al repo

Qué hace cada archivo
server.js
Carga variables de entorno con dotenv.
Configura Express, CORS y body parsers.
Sirve la carpeta public/.
Monta las rutas de API bajo /api.
Healthcheck en /health.
Manejador de errores JSON.
public/index.html
UI mínima: input de archivo, botón Start, contenedor de estado.
Tema negro con morado y degradé.
public/styles.css
Estilos base. Paleta y layout minimal.
Botones, tipografías del UI.
public/app.js
Habilita el botón cuando hay archivo.
Hace POST /api/subtitle para subir MP4.
Hace POST /api/subtitle/:id/process para transcribir, construir .ass y quemar con FFmpeg.
Muestra link de descarga cuando termina.
routes/jobs.js
Endpoint POST /api/subtitle:
Valida solo MP4 y ≤ 10 MB (Multer).
Guarda el archivo en tmp/ con nombre normalizado ID.mp4.
Devuelve { id, filename }.
Endpoint POST /api/subtitle/:id/process:
Reconstruye el registro aunque el server se haya reiniciado (fallback por archivo en tmp/).
Llama a transcribeToWords para obtener { words: [{text, start, end}] }.
Llama a getTargetDimensions para conocer la altura real de salida.
Calcula fontSize y marginV en función de esa altura.
Llama a buildASS para crear el contenido del .ass con segmentación.
Llama a burnWithASS para renderizar el MP4 final.
Devuelve link /api/subtitle/:id/download.
Endpoint GET /api/subtitle/:id/download:
Streamea el MP4 final.
services/transcriber.js
Usa OpenAI (Whisper) para transcribir el audio del MP4.
Pide verbose_json para tener segmentos con start y end.
Si no hay word-level, distribuye el tiempo del segmento entre las palabras según un reparto simple. Esto es suficiente para clips cortos.
Devuelve un arreglo de palabras con tiempos.
services/ass-builder.js
Construye el .ASS con estilo y eventos de karaoke.
Segmenta el texto en líneas cortas:
Corta por pausas mayores a 0.5 s.
Corta al pasar 2.8 s de duración de bloque.
Corta al superar 42 caracteres aproximados.
Cada línea se convierte en un Dialogue con \k por palabra. El texto aparece línea a línea, no todo a la vez.
services/burner.js
Expone burnWithASS:
Filtro scale para encajar en 1080p con relación de aspecto,
Filtro subtitles para quemar .ass,
-crf 23 para un peso razonable y -c:a copy para mantener el audio.
Expone getTargetDimensions:
Usa ffprobe para leer dimensiones del input,
Calcula el tamaño final que encaja en 1920x1080.
Se usa para escalar tipografía y margen.
nodemon.json
Ignora cambios en tmp/, public/, fonts/ para evitar reinicios durante el proceso y cortes de conexión.
Observa solo server.js, routes, services.
## 🔧 Instalación y Configuración

### 📋 Requisitos del Sistema
- **Node.js** 18.0.0+ y npm 8.0.0+
- **OpenAI API Key** activa con acceso a Whisper
- **Git** para clonación del repositorio
- **10 MB** de espacio libre para archivos temporales

### 1️⃣ Clonar el Repositorio
```bash
git clone https://github.com/JorgeGdev/MangoAIVideoSubtitle.git
cd MangoAIVideoSubtitle
```

### 2️⃣ Instalar Dependencias
```bash
npm install
```
> **Nota:** FFmpeg se instala automáticamente via `@ffmpeg-installer/ffmpeg` y `ffmpeg-static`

### 3️⃣ Configurar Variables de Entorno
Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

**Configura tu API key de OpenAI:**
```env
OPENAI_API_KEY=sk-proj-tu-api-key-aqui
PORT=3000
```

### 4️⃣ Ejecutar en Desarrollo
```bash
npm run dev
```
> **Hot reload** activado - los cambios se reflejan automáticamente

### 5️⃣ Ejecutar en Producción
```bash
npm start
```

### 6️⃣ Verificar Instalación
Abre tu navegador en: `http://localhost:3000`

---

## 🎮 Guía de Uso Completa

### 🌐 **Interfaz Web Intuitiva**
1. **📁 Selecciona** tu archivo MP4 (máximo 10 MB)
2. **▶️ Presiona** el botón "Start" para iniciar
3. **⏳ Observa** el progreso en tiempo real
4. **📥 Descarga** múltiples formatos cuando esté listo

### 📊 **Formatos de Salida**
- **🎬 Video MP4** - Con subtítulos quemados y outro
- **📄 Archivo TXT** - Subtítulos con timestamps `[MM:SS]`
- **📋 Markdown** - Formato enriquecido con metadatos
- **📝 Transcripción** - Texto plano sin timestamps

### 🎯 **Especificaciones Técnicas**
- **Duración recomendada:** 10-30 segundos
- **Tamaño máximo:** 10 MB
- **Formatos aceptados:** MP4 únicamente
- **Resolución de salida:** Hasta 1080p (escalado automático)
- **Calidad:** CRF 23 (balance óptimo peso/calidad)

## 📡 API Documentation

### 🔼 **Upload Endpoint**
```http
POST /api/subtitle
```
**Content-Type:** `multipart/form-data`

**Parámetros:**
- `file` (required) - Archivo MP4, máximo 10 MB

**Respuesta exitosa (200):**
```json
{
  "status": "uploaded",
  "id": "1762836970114_664ccde39cbd4c08",
  "filename": "1762836970114_664ccde39cbd4c08.mp4",
  "sizeBytes": 8547291,
  "path": "/tmp/1762836970114_664ccde39cbd4c08.mp4"
}
```

### ⚡ **Process Endpoint**
```http
POST /api/subtitle/:id/process
```
**Content-Type:** `application/x-www-form-urlencoded`

**Parámetros opcionales:**
- `filename` - Nombre del archivo (para robustez)
- `style` - Configuración de estilos en JSON

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "id": "1762836970114_664ccde39cbd4c08",
  "downloadUrl": "/api/subtitle/1762836970114_664ccde39cbd4c08/download",
  "txtUrl": "/api/subtitle/1762836970114_664ccde39cbd4c08/download/txt",
  "mdUrl": "/api/subtitle/1762836970114_664ccde39cbd4c08/download/md",
  "transcriptUrl": "/api/subtitle/1762836970114_664ccde39cbd4c08/download/transcript"
}
```

### 📥 **Download Endpoints**

#### **Video Principal**
```http
GET /api/subtitle/:id/download
```
Devuelve el video MP4 final con subtítulos y outro.

#### **Subtítulos TXT**
```http
GET /api/subtitle/:id/download/txt
```
Formato: `[MM:SS] Texto de subtítulo`

#### **Subtítulos Markdown**
```http
GET /api/subtitle/:id/download/md
```
Incluye metadatos y formato enriquecido.

#### **Transcripción Completa**
```http
GET /api/subtitle/:id/download/transcript
```
Texto plano sin timestamps.

### 💚 **Health Check**
```http
GET /health
```
**Respuesta:**
```json
{ "ok": true }
```

---

## ⚙️ Módulos de Procesamiento Especializados

### 🎙️ **Transcriber** (`services/transcriber.js`)
**Funcionalidad:**
- Integración directa con OpenAI Whisper API
- Transcripción word-level con timing preciso
- Distribución inteligente de tiempos en segmentos
- Manejo robusto de errores de API
- Optimización para clips de 10-30 segundos

**Configuración:**
```javascript
{
  model: 'whisper-1',
  response_format: 'verbose_json',
  temperature: 0  // Máxima precisión
}
```

### 📄 **ASS Builder** (`services/ass-builder.js`)
**Funcionalidad:**
- Generación avanzada de archivos .ASS para karaoke
- Segmentación inteligente por pausas, duración y longitud
- Anti-overlap automático para legibilidad
- Configuración granular de estilos visuales
- Timing optimizado para efectos karaoke word-by-word

**Algoritmo de Segmentación:**
```javascript
{
  gapThresholdSec: 0.5,    // Pausa mínima para nuevo segmento
  maxLineDurSec: 2.8,      // Duración máxima por línea
  maxChars: 42,            // Caracteres máximos por línea
  minWordSec: 0.06,        // Duración mínima por palabra
  leadSec: 0.0,            // Tiempo de entrada
  tailSec: 0.12,           // Tiempo de salida
  warmupCs: 6,             // Calentamiento en centésimas
  minInterGapSec: 0.06     // Gap mínimo entre palabras
}
```

### 📝 **Text Exporter** (`services/text-exporter.js`)
**Funcionalidad:**
- Exportación multi-formato (TXT, MD, transcripción)
- Preservación de estructura temporal
- Metadatos automáticos con información del proceso
- Timestamps formateados para fácil lectura
- Segmentación coherente con el video

### 🔥 **Burner** (`services/burner.js`)
**Funcionalidad:**
- Burn-in profesional de subtítulos con FFmpeg
- Escalado automático y adaptativo para cualquier resolución
- Preservación inteligente de aspect ratio
- Configuración avanzada de calidad (CRF 23)
- Optimización de codecs para máxima compatibilidad

**Pipeline de Renderizado:**
1. Análisis de dimensiones del video origen
2. Cálculo de escalado para fit en 1080p
3. Aplicación de filtro de subtítulos con libass
4. Codificación con libx264 y preservación de audio
5. Optimización para streaming web (faststart)

### 🎭 **Outro** (`services/outro.js`) - ⭐ **NUEVA CARACTERÍSTICA**
**Funcionalidad:**
- **Crossfade suave** entre video principal y outro
- **Normalización automática** de framerates diferentes
- **Mezcla inteligente** de audio stereo/mono
- **Sincronización temporal** perfecta
- **Compatibilidad universal** (yuv420p)

**Características Técnicas:**
```javascript
{
  crossfadeDuration: 0.3,        // Duración del crossfade en segundos
  videoNormalization: true,      // Normaliza FPS y dimensiones
  audioMixing: 'acrossfade',     // Mezcla suave de audio
  pixelFormat: 'yuv420p',        // Formato universal
  qualityPreset: 'veryfast',     // Balance velocidad/calidad
  modernFFmpeg: true             // Usa ffmpeg-static con filtros avanzados
}
```

**Algoritmo Inteligente:**
1. **Análisis de compatibilidad** entre videos (FPS, dimensiones, audio)
2. **Normalización automática** de framerates para evitar errores de timebase
3. **Escalado dinámico** del outro para coincidir con video principal
4. **Crossfade temporal** con timing preciso calculado automáticamente
5. **Renderizado final** con máxima compatibilidad web/móvil
Límites, calidad y rendimiento
Tamaño: subida limitada a 10 MB.
Duración: pensado para clips entre 18 y 30 s.
Resolución: se hace downscale a 1080p si entra algo más grande.
Calidad: CRF 23 equilibra tamaño y calidad. Puedes bajar a 21 si priorizas calidad, o subir a 25 si priorizas peso.
Dependencias principales
express: servidor HTTP.
multer: subida de archivos.
fluent-ffmpeg y @ffmpeg-installer/ffmpeg: render y filtros de video.
openai: cliente oficial para Whisper.
dotenv: variables de entorno.
cors: permitir peticiones desde el navegador.
nodemon: recarga en desarrollo.
Retos y soluciones
Cortes de conexión en proceso
Problema: al escribir archivos en tmp/, nodemon reiniciaba el server durante el process, lo que causaba ERR_CONNECTION_RESET.
Solución: ignorar tmp/ en nodemon.json.

“Upload id not found”
Problema: el Map en memoria se perdía si el server se reiniciaba entre el upload y el process.
Solución: fallback en disco. Si el id no está en memoria, buscamos el ID*.mp4 en tmp/ y reconstruimos el registro.

Todo el texto aparecía a la vez
Problema: una sola línea ASS gigante tapaba el video.
Solución: algoritmo de segmentación por pausas, duración y caracteres, con múltiples Dialogue.

Rutas y escapado en Windows
Problema: FFmpeg en Windows requiere escapar \ y : dentro del filtro subtitles.
Solución: normalizar rutas antes de pasarlas al filtro.

Tamaño de fuente y margen
Problema: en vertical u horizontal, la misma fuente no sirve.
Solución: escalado automático por altura de salida.

Configurar estilos

Puedes pasar un style JSON en POST /api/subtitle/:id/process (urlencoded o JSON) con estos campos:

{
  "font": "Montserrat",
  "fontSize": 60,
  "primary": "&H00FFFFFF&",
  "outline": 3,
  "shadow": 0,
  "align": 2,
  "marginV": 120,
  "segment": {
    "gapThresholdSec": 0.5,
    "maxLineDurSec": 2.8,
    "maxChars": 42
  }
}


primary es color en formato ASS BGR con alpha.
align=2 es bottom center. Puedes usar 8 para top center si alguna vez quieres ponerlo arriba.
Si el sistema no encuentra Montserrat, el render usará una fuente sustituta. En Windows puedes instalar la TTF. Otra opción es instalar la fuente en el contenedor del despliegue.
Notas de seguridad
No subas .env al repo.
En Railway, configura OPENAI_API_KEY en el panel de variables.
Limita el tamaño de subida en Multer. Ya está en 10 MB.
Despliegue en Railway
Crea repo en GitHub con este proyecto.
En Railway:
Nuevo proyecto → Deploy from GitHub repo.
Variables: OPENAI_API_KEY y PORT=3000.
Start Command:
node server.js

Si usas Dockerfile, instala @ffmpeg-installer/ffmpeg en build o confía en el paquete ya incluido.
Abre la URL pública de Railway para probar.
Mejoras futuras
ASR local opcional con whisper.cpp o faster-whisper para reducir costos por API.
Color de karaoke configurable (SecondaryColour en ASS).
Detección de pausas más inteligente por RMS/energía con ffmpeg + silencedetect.
Exportar también .ass para depuración.
Batch de varios clips.
Cola de trabajos si el tráfico aumenta.