# 🎬 Subtitles Generator

Generador de subtítulos karaoke automático con OpenAI Whisper y FFmpeg. Sube un video MP4, obtén subtítulos quemados en el video + archivo de texto con los subtítulos.

## ✨ Características

- 🎥 **Genera video** con subtítulos karaoke quemados (estilo Montserrat)
- 📄 **Archivo de texto** con subtítulos y timestamps `[MM:SS] Texto`
- 🤖 **OpenAI Whisper** para transcripción automática
- 🎨 **Diseño minimalista** en negro y morado
- ⚡ **Procesamiento rápido** para videos de 10-30 segundos
- 🔄 **Descarga automática** de archivos generados

## 🚀 Demo en vivo

**Railway:** [Próximamente]

## 🛠️ Stack Tecnológico

- **Backend:** Node.js + Express
- **Transcripción:** OpenAI Whisper API
- **Video:** FFmpeg + fluent-ffmpeg
- **Frontend:** HTML/CSS/JS vanilla
- **Deploy:** Railway (con soporte FFmpeg nativo)

Estructura de proyecto (web aparte)
subtitles-karaoke/
  server.js              # Express: sirve el frontend y expone /api/subtitle
  routes/
    jobs.js              # POST /api/subtitle  (upload MP4 → procesa → devuelve job/result)
  services/
    transcriber.js       # llama Whisper (OpenAI) → palabras con timestamps
    ass-builder.js       # build .ass (Montserrat, outline/shadow/align/margin)
    burner.js            # FFmpeg: burn-in .ass + downscale 1080p CRF 23
  tmp/                   # archivos temporales (mp4 in, wav, ass, mp4 out)
  public/
    index.html           # UI minimal (negro + morado)
    styles.css
    app.js               # fetch al backend + estado
  .env.example           # OPENAI_API_KEY
  package.json           # (puede ser propio o usar el de tu monorepo)
  README.md


Todo esto usa solo Node con tus libs ya declaradas (Express, Multer, fluent-ffmpeg, @ffmpeg-installer/ffmpeg, OpenAI). No metemos Python ni frameworks extra. 

package

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
Instalación y requisitos
Node.js 18 o superior.
FFmpeg incluido por @ffmpeg-installer/ffmpeg (no hace falta instalar FFmpeg por separado).
Cuenta de OpenAI con OPENAI_API_KEY activa.
Ejecución local
Instalar dependencias:
npm install

Crear .env en la raíz:
PORT=3000
OPENAI_API_KEY=sk-...


Iniciar en desarrollo:

npm run dev


Abrir:

http://localhost:3000

Uso desde el navegador
1. Selecciona un MP4 pequeño (≤ 10 MB).
2. Clic en Start.
3. Espera el mensaje Done.
4. Descarga los archivos generados:
   - **Video MP4** con subtítulos quemados
   - **Archivo TXT** con los subtítulos y timestamps
   - **Archivo Markdown** con los subtítulos formateados
   - **Transcripción completa** en texto plano

El video final tendrá subtítulos karaoke en Montserrat.

API
POST /api/subtitle
form-data: file (MP4 ≤ 10 MB)
res 200:

{
  "status": "uploaded",
  "id": "1760926365000_abcd1234",
  "filename": "1760926365000_abcd1234.mp4",
  "sizeBytes": 6403712,
  "path": "E:/.../tmp/1760926365000_abcd1234.mp4"
}

POST /api/subtitle/:id/process

body opcional:

filename: por robustez,

style: JSON string para sobreescribir estilo (ver más abajo).

res 200:

{
  "ok": true,
  "id": "1760926365000_abcd1234",
  "downloadUrl": "/api/subtitle/1760926365000_abcd1234/download",
  "txtUrl": "/api/subtitle/1760926365000_abcd1234/download/txt",
  "mdUrl": "/api/subtitle/1760926365000_abcd1234/download/md",
  "transcriptUrl": "/api/subtitle/1760926365000_abcd1234/download/transcript"
}

### GET /api/subtitle/:id/download
Devuelve el MP4 final con subtítulos quemados.

### GET /api/subtitle/:id/download/txt
Devuelve un archivo de texto plano (.txt) con los subtítulos y timestamps en formato `[MM:SS] Texto`.

### GET /api/subtitle/:id/download/md
Devuelve un archivo Markdown (.md) con los subtítulos formateados, timestamps e información de generación.

### GET /api/subtitle/:id/download/transcript
Devuelve la transcripción completa en texto plano sin timestamps.

## Cómo funciona por dentro

Upload
Guardamos el archivo en tmp/ con nombre ID.mp4. Validamos tipo y tamaño.
Transcribe
Tomamos el audio del MP4 y pedimos transcripción a Whisper. Obtenemos texto y segmentos temporales. Si no hay palabra por palabra nativa, distribuimos tiempos dentro de cada segmento.
Segmentación
Convertimos la lista de palabras en bloques o líneas con heurísticas simples: pausas, duración y caracteres.
.ASS karaoke
Por cada línea generamos un Dialogue con override tags \k por palabra. El color de relleno se anima como karaoke.
Render
Con FFmpeg:
Escalamos el video para encajar en 1080p con relación de aspecto,
Aplicamos el filtro subtitles=archivo.ass,
Codificamos con libx264 a CRF 23 y mantenemos audio con copy.
Descarga
Streameamos el MP4 final y limpiamos cuando sea necesario.
Algoritmo de segmentación karaoke
Reglas por defecto:
Pausa entre palabras mayor a 0.5 s → corte de línea,
Duración del bloque mayor a 2.8 s → corte de línea,
Longitud acumulada mayor a 42 caracteres → corte de línea.
Esto evita mostrar todo el texto a la vez y produce bloques de lectura cómoda. Puedes ajustar estos valores en buildASS con segment: { gapThresholdSec, maxLineDurSec, maxChars }.
Escalado de tipografía y margen vertical
Para que el texto se vea bien en videos verticales u horizontales:
Leemos la altura final del video con ffprobe y fitBox a 1080p.
Definimos:
fontSize = max(36, round(altura * 0.055))
marginV = round(altura * 0.12) para subir el texto un poco.
Estos parámetros se pasan a buildASS. Puedes cambiarlos a tu gusto.
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