/* =========================================================
   Asistente Dev · Servidor (acceso seguro al modelo)

   - Sirve la página (index.html, css/, js/).
   - Recibe las preguntas en POST /api/preguntar.
   - Vuelve a aplicar las reglas de la semana 2 AQUÍ, en el
     servidor: nunca confiamos solo en el navegador.
   - Llama a la API de Claude con la clave guardada en .env.
     La clave NUNCA llega al navegador.

   Sin dependencias: solo Node.js 18 o superior.
   Arrancar:  node server.js   (o  npm start)
   ========================================================= */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { protegerDatos, motivoHumano } = require("./js/reglas.js");

// ---------- 1. Configuración desde .env ----------
function cargarEnv(archivo) {
  if (!fs.existsSync(archivo)) return;
  for (const linea of fs.readFileSync(archivo, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
cargarEnv(path.join(__dirname, ".env"));

const CONFIG = {
  clave:   process.env.ANTHROPIC_API_KEY || "",
  modelo:  process.env.CLAUDE_MODEL || "claude-haiku-5-5",
  version: process.env.ANTHROPIC_VERSION || "2026-10-21",
  baseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
  puerto:  Number(process.env.PORT) || 3000,
  host:    process.env.HOST || "127.0.0.1",   // solo tu computador, por defecto
};

// ---------- 2. Instrucciones para Claude (prompt de sistema) ----------
// Aquí viven las decisiones de diseño de las semanas 1 y 2.
const SISTEMA = `Eres Asistente Dev, un asistente de programación para desarrolladores junior.
Respondes dudas de HTML, CSS, JavaScript, Git, bases de datos y desarrollo web, en español.

Reglas:
- Respuestas cortas y claras. Si ayuda, incluye UN bloque de código mínimo y probado.
- Cita como fuente la documentación oficial (MDN Web Docs, documentación de Node.js, Git, PostgreSQL, etc.).
  Usa solo enlaces que estés seguro de que existen; si no estás seguro de una URL, deja la fuente sin enlace.
- Si no sabes la respuesta o no hay documentación confiable (por ejemplo, APIs internas de una empresa),
  dilo con honestidad: no inventes funciones, endpoints ni versiones.
- No tomes decisiones sobre personas (contratar, despedir, evaluar a alguien), salud, dinero o producción:
  informa y recomienda hablar con un mentor.
- Nunca pidas contraseñas, tokens ni datos personales.
- Algunos datos de la pregunta pueden venir ocultos como [correo], [celular], [documento] o [clave]: es intencional.

Responde SOLO con un objeto JSON válido, sin texto antes ni después, con esta forma:
{"sabe": true, "respuesta": "explicación corta", "codigo": "código o cadena vacía", "lenguaje": "css|js|html|bash|sql|", "fuentes": [{"nombre": "MDN Web Docs · Flexbox", "url": "https://developer.mozilla.org/..."}]}
Si no sabes: {"sabe": false, "respuesta": "qué no sabes y qué puede hacer el dev", "codigo": "", "lenguaje": "", "fuentes": []}`;

// ---------- 3. Llamada a la API de Claude ----------
async function preguntarAClaude(preguntaSegura) {
  const r = await fetch(`${CONFIG.baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": CONFIG.clave,
      "anthropic-version": CONFIG.version,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CONFIG.modelo,
      max_tokens: 1024,
      system: SISTEMA,
      messages: [{ role: "user", content: preguntaSegura }],
    }),
  });

  const datos = await r.json().catch(() => ({}));
  if (!r.ok) {
    const detalle = datos?.error?.message || `HTTP ${r.status}`;
    throw Object.assign(new Error(detalle), { status: r.status });
  }

  // El texto de la respuesta viene en los bloques de tipo "text"
  const texto = (datos.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return interpretar(texto);
}

// Convierte el JSON de Claude en algo seguro para la página
function interpretar(texto) {
  let obj = null;
  const ini = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");
  if (ini !== -1 && fin > ini) {
    try { obj = JSON.parse(texto.slice(ini, fin + 1)); } catch { obj = null; }
  }
  if (!obj) {
    // Si no vino JSON, mostramos el texto tal cual, sin fuentes
    return { sabe: true, respuesta: texto.trim(), codigo: "", lenguaje: "", fuentes: [] };
  }
  const fuentes = Array.isArray(obj.fuentes) ? obj.fuentes.slice(0, 5).map((f) => ({
    nombre: String(f?.nombre || "Documentación").slice(0, 120),
    // Solo enlaces https: nada de javascript: ni rutas raras
    url: /^https:\/\/[^\s"'<>]+$/.test(f?.url || "") ? f.url : "",
  })) : [];
  return {
    sabe: obj.sabe !== false,
    respuesta: String(obj.respuesta || "").slice(0, 4000),
    codigo: String(obj.codigo || "").slice(0, 6000),
    lenguaje: String(obj.lenguaje || "").slice(0, 12),
    fuentes,
  };
}

// ---------- 4. Servidor HTTP ----------
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".png": "image/png",
  ".svg": "image/svg+xml", ".pdf": "application/pdf", ".ico": "image/x-icon",
};
// Solo se sirven estos archivos y carpetas (nunca .env ni server.js)
const PUBLICO = new Set(["index.html", "css", "js", "docs"]);

function enviarJSON(res, estado, cuerpo) {
  res.writeHead(estado, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(cuerpo));
}

function leerCuerpo(req, limite = 10_000) {
  return new Promise((resolve, reject) => {
    let datos = "";
    req.on("data", (trozo) => {
      datos += trozo;
      if (datos.length > limite) { reject(new Error("Pregunta demasiado larga")); req.destroy(); }
    });
    req.on("end", () => resolve(datos));
    req.on("error", reject);
  });
}

async function manejarPregunta(req, res) {
  let pregunta = "";
  try {
    pregunta = String(JSON.parse(await leerCuerpo(req)).pregunta || "").trim();
  } catch (e) {
    return enviarJSON(res, 400, { error: "No pude leer la pregunta." });
  }
  if (!pregunta) return enviarJSON(res, 400, { error: "La pregunta está vacía." });
  if (pregunta.length > 2000) return enviarJSON(res, 400, { error: "La pregunta es demasiado larga (máximo 2000 caracteres)." });

  // Reglas de la semana 2, otra vez en el servidor
  const motivo = motivoHumano(pregunta);
  const segura = protegerDatos(pregunta);
  if (motivo) return enviarJSON(res, 200, { tipo: "humano", motivo, pregunta: segura });

  if (!CONFIG.clave) {
    return enviarJSON(res, 503, { error: "Falta ANTHROPIC_API_KEY en el archivo .env del servidor." });
  }

  try {
    const r = await preguntarAClaude(segura);
    return enviarJSON(res, 200, { tipo: r.sabe ? "respuesta" : "no-sabe", pregunta: segura, ...r });
  } catch (e) {
    // No se registra el contenido de la pregunta (privacidad)
    console.error(`[Claude] error ${e.status || ""}: ${e.message}`);
    const msg = e.status === 401 ? "La clave de API no es válida. Revisa tu archivo .env."
              : e.status === 429 ? "Demasiadas preguntas seguidas. Espera un momento e intenta de nuevo."
              : "No pude hablar con Claude en este momento. Intenta de nuevo.";
    return enviarJSON(res, 502, { error: msg });
  }
}

function servirArchivo(req, res) {
  const ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const relativa = ruta === "/" ? "index.html" : path.normalize(ruta).replace(/^[/\\]+/, "");
  const primerTramo = relativa.split(/[/\\]/)[0];
  const absoluta = path.join(__dirname, relativa);

  if (!PUBLICO.has(primerTramo) || !absoluta.startsWith(__dirname + path.sep)) {
    res.writeHead(404); return res.end("No encontrado");
  }
  fs.readFile(absoluta, (err, contenido) => {
    if (err) { res.writeHead(404); return res.end("No encontrado"); }
    res.writeHead(200, { "content-type": TIPOS[path.extname(absoluta)] || "application/octet-stream" });
    res.end(contenido);
  });
}

const servidor = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/preguntar") return manejarPregunta(req, res);
  if (req.method === "GET" && req.url === "/api/estado") {
    return enviarJSON(res, 200, { conectado: Boolean(CONFIG.clave), modelo: CONFIG.modelo });
  }
  if (req.method === "GET") return servirArchivo(req, res);
  res.writeHead(405); res.end();
});

if (require.main === module) {
  servidor.listen(CONFIG.puerto, CONFIG.host, () => {
    console.log(`Asistente Dev en http://localhost:${CONFIG.puerto}`);
    console.log(CONFIG.clave
      ? `Conectado a Claude (${CONFIG.modelo}).`
      : "⚠ Falta ANTHROPIC_API_KEY en .env: la página funcionará en modo maqueta.");
  });
}

module.exports = { servidor, interpretar, SISTEMA };
