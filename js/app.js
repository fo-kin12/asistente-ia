/* =========================================================
   Asistente Dev · La interfaz habla con Claude

   Flujo cuando el dev envía una pregunta:
     1. protegerDatos()  oculta datos personales y claves
     2. motivoHumano()   si es delicado, va a una persona (sin modelo)
     3. Si no, «Buscando…» y se pregunta al servidor (/api/preguntar),
        que llama a Claude con la clave guardada en .env
     4. Se pinta la respuesta con su fuente y el aviso()

   Si no hay servidor (por ejemplo, con Live Server) o falta la
   clave, la página sigue funcionando en «modo maqueta».
   ========================================================= */

const formulario = document.querySelector(".consulta");
const campo = document.getElementById("pregunta");
const insignia = document.getElementById("estado-conexion");

// Guardamos la maqueta original para el modo sin servidor
const MAQUETA = {
  respuesta: document.querySelector("#respuesta .mensaje.asistente").innerHTML,
  error: document.querySelector("#error .mensaje.asistente").innerHTML,
};

let conectado = false;   // ¿hay servidor con clave de Claude?

// Mensajes del estado «tema delicado» según el motivo
const MENSAJES_HUMANO = {
  "seguridad": {
    titulo: "🔒 No compartas credenciales aquí.",
    texto: "Si ya expusiste esa clave en algún lugar, cámbiala. Un problema con credenciales o datos de producción lo revisa una persona del equipo."
  },
  "alto-impacto": {
    titulo: "🙋 Este tema lo decide una persona.",
    texto: "Salud, dinero, notas o decisiones sobre alguien tienen alto impacto. Puedo darte información general, pero la decisión la toma una persona."
  }
};

// ---------- Utilidades de interfaz ----------

// Crea un elemento con texto (siempre textContent: nunca HTML que venga del modelo)
function el(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

function irA(idEstado) {
  location.hash = idEstado;   // el CSS (:target) muestra ese estado
}

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Pinta el aviso (regla 3) en cada respuesta, a partir de sus fuentes
function pintarAvisos() {
  document.querySelectorAll(".aviso-respuesta[data-fuentes]").forEach((p) => {
    const fuentes = p.dataset.fuentes ? p.dataset.fuentes.split("|") : [];
    p.textContent = "📢 " + aviso(fuentes);
  });
}

// Escribe la pregunta (ya protegida) en la burbuja del estado destino
function escribirPregunta(idEstado, preguntaSegura, ocultos) {
  const estado = document.getElementById(idEstado);
  const burbuja = estado.querySelector(".mensaje.usuario");
  if (burbuja) burbuja.textContent = preguntaSegura;

  estado.querySelectorAll(".nota-privacidad").forEach((n) => n.remove());
  if (ocultos > 0 && burbuja) {
    burbuja.after(el("p", "nota-privacidad",
      `🔒 Ocultamos ${ocultos} ${ocultos === 1 ? "dato sensible" : "datos sensibles"} antes de enviar tu pregunta.`));
  }
}

function mostrarHumano(motivo, segura, ocultos) {
  escribirPregunta("delicado", segura, ocultos);
  document.getElementById("delicado-titulo").textContent = MENSAJES_HUMANO[motivo].titulo;
  document.getElementById("delicado-texto").textContent = MENSAJES_HUMANO[motivo].texto;
  irA("delicado");
}

// ---------- Respuestas reales de Claude ----------

function pintarRespuesta(d) {
  const caja = document.querySelector("#respuesta .mensaje.asistente");
  caja.replaceChildren();

  // Explicación: un párrafo por bloque de texto
  d.respuesta.split(/\n{2,}/).filter(Boolean).forEach((parrafo) => caja.append(el("p", "", parrafo)));

  // Código (como texto plano: seguro y fácil de copiar)
  if (d.codigo) {
    const pre = el("pre", "codigo");
    pre.append(el("code", "", d.codigo));
    caja.append(pre);
  }

  // Fuentes con enlace (solo https, ya validado en el servidor)
  const nombres = d.fuentes.map((f) => f.nombre);
  if (d.fuentes.length) {
    const linea = el("p", "fuente");
    const lista = el("span", "", d.fuentes.length === 1 ? "Fuente: " : "Fuentes: ");
    d.fuentes.forEach((f, i) => {
      if (i) lista.append(document.createTextNode(", "));
      if (f.url) {
        const a = el("a", "", f.nombre);
        a.href = f.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        lista.append(a);
      } else {
        lista.append(el("span", "", f.nombre));
      }
    });
    linea.append(el("span", "fuente-icono", "📄"), lista);
    caja.append(linea);
  }

  // Aviso: cómo se generó (regla 3)
  caja.append(el("p", "aviso-respuesta", "📢 " + aviso(nombres)));

  // Acciones
  const acciones = el("div", "acciones");
  if (d.codigo) acciones.append(el("button", "", "Copiar código"));
  acciones.append(el("span", "separa"), el("span", "", "¿Te sirvió?"));
  const si = el("button", "", "👍"); si.setAttribute("aria-label", "Me sirvió");
  const no = el("button", "", "👎"); no.setAttribute("aria-label", "No me sirvió");
  acciones.append(si, no);
  acciones.querySelectorAll("button").forEach((b) => (b.type = "button"));
  caja.append(acciones);
}

function pintarNoSabe(titulo, texto) {
  const caja = document.querySelector("#error .mensaje.asistente");
  caja.replaceChildren(el("p", "titulo-msg", titulo));
  if (texto) caja.append(el("p", "", texto));
  const lista = el("ul");
  lista.append(el("li", "", "Reformular la pregunta con más detalle o con un ejemplo de tu código."));
  const li = el("li");
  const a = el("a", "humano-inline", "Preguntarle a un mentor del equipo");
  a.href = "#mentor";
  li.append(a, document.createTextNode("."));
  lista.append(li);
  caja.append(lista, el("p", "aviso-respuesta", "📢 " + aviso([])));
}

// ---------- Modo maqueta (sin servidor) ----------

function responderMaqueta(original, segura, ocultos) {
  document.querySelector("#respuesta .mensaje.asistente").innerHTML = MAQUETA.respuesta;
  document.querySelector("#error .mensaje.asistente").innerHTML = MAQUETA.error;
  pintarAvisos();

  const tieneRespuesta = /flex|centr/i.test(original);
  const destino = tieneRespuesta ? "respuesta" : "error";
  escribirPregunta(destino, segura, ocultos);
  if (!tieneRespuesta) {
    document.querySelector("#error .titulo-msg").textContent = "No encuentro eso en la documentación que tengo.";
    document.querySelector("#error li").textContent = "Reformular la pregunta con más detalle o con un ejemplo de tu código.";
  }
  setTimeout(() => irA(destino), 1600);
}

// ---------- Envío del formulario ----------

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const original = campo.value.trim();
  if (!original) { campo.focus(); return; }
  campo.value = "";

  // 1. Privacidad
  const segura = protegerDatos(original);
  const ocultos = contarOcultos(original);

  // 2. Alto impacto: va a una persona, sin consultar al modelo
  const motivo = motivoHumano(original);
  if (motivo) return mostrarHumano(motivo, segura, ocultos);

  // 3. «Buscando…»
  escribirPregunta("cargando", segura, ocultos);
  irA("cargando");

  if (!conectado) return responderMaqueta(original, segura, ocultos);

  // 4. Pregunta a Claude a través del servidor (la clave nunca llega aquí)
  try {
    const [r] = await Promise.all([
      fetch("/api/preguntar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: segura }),
      }),
      esperar(700),   // que «Buscando…» se alcance a ver
    ]);
    const d = await r.json();

    if (!r.ok) {
      escribirPregunta("error", segura, ocultos);
      pintarNoSabe("⚠ " + (d.error || "No pude obtener una respuesta."), "");
      return irA("error");
    }
    if (d.tipo === "humano") return mostrarHumano(d.motivo, d.pregunta, ocultos);
    if (d.tipo === "no-sabe") {
      escribirPregunta("error", d.pregunta, ocultos);
      pintarNoSabe("No tengo una respuesta confiable para eso.", d.respuesta);
      return irA("error");
    }
    escribirPregunta("respuesta", d.pregunta, ocultos);
    pintarRespuesta(d);
    irA("respuesta");
  } catch {
    escribirPregunta("error", segura, ocultos);
    pintarNoSabe("⚠ Se perdió la conexión con el servidor.", "Revisa que siga corriendo (node server.js) e intenta de nuevo.");
    irA("error");
  }
});

// Botones de las respuestas (delegación de eventos)
document.addEventListener("click", async (e) => {
  const boton = e.target.closest(".acciones button");
  if (!boton) return;
  if (boton.textContent.startsWith("Copiar")) {
    const codigo = boton.closest(".mensaje").querySelector("pre")?.textContent || "";
    try { await navigator.clipboard.writeText(codigo); boton.textContent = "Copiado ✓"; }
    catch { boton.textContent = "No se pudo copiar"; }
    setTimeout(() => (boton.textContent = "Copiar código"), 1800);
  } else {
    boton.closest(".acciones").querySelectorAll("button[aria-label]").forEach((b) => (b.disabled = true));
    boton.classList.add("elegido");
  }
});

// ---------- ¿Hay servidor con Claude? ----------
async function revisarConexion() {
  try {
    const r = await fetch("/api/estado");
    const d = r.ok ? await r.json() : null;
    conectado = Boolean(d && d.conectado);
    insignia.textContent = conectado ? "● Claude conectado" : (d ? "○ Falta la clave" : "○ Modo maqueta");
  } catch {
    conectado = false;
    insignia.textContent = "○ Modo maqueta";
  }
  insignia.classList.toggle("en-linea", conectado);
}

pintarAvisos();
revisarConexion();
