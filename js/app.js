/* =========================================================
   Asistente Dev · Conexión de las reglas con la interfaz

   Flujo cuando el dev envía una pregunta:
     1. protegerDatos()  oculta datos personales y claves
     2. requiereHumano() / motivoHumano() decide si va a una persona
     3. Si no, «Buscando…» y luego la respuesta (o el «no lo sé»)
     4. aviso() escribe bajo la respuesta cómo se generó

   Todavía no hay modelo: las respuestas son las de la maqueta.
   Aquí es donde, más adelante, irá la llamada al servidor.
   ========================================================= */

const formulario = document.querySelector(".consulta");
const campo = document.getElementById("pregunta");

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

// Pinta el aviso (regla 3) en cada respuesta, a partir de sus fuentes
function pintarAvisos() {
  document.querySelectorAll(".aviso-respuesta").forEach((p) => {
    const fuentes = p.dataset.fuentes ? p.dataset.fuentes.split("|") : [];
    p.textContent = "📢 " + aviso(fuentes);
  });
}

// Escribe la pregunta (ya protegida) en la burbuja del estado destino
function escribirPregunta(idEstado, preguntaSegura, ocultos) {
  const estado = document.getElementById(idEstado);
  const burbuja = estado.querySelector(".mensaje.usuario");
  if (burbuja) burbuja.textContent = preguntaSegura;

  // Nota de privacidad: le decimos al dev qué protegimos
  estado.querySelectorAll(".nota-privacidad").forEach((n) => n.remove());
  if (ocultos > 0 && burbuja) {
    const nota = document.createElement("p");
    nota.className = "nota-privacidad";
    nota.textContent = `🔒 Ocultamos ${ocultos} ${ocultos === 1 ? "dato sensible" : "datos sensibles"} antes de enviar tu pregunta.`;
    burbuja.after(nota);
  }
}

function irA(idEstado) {
  location.hash = idEstado;   // el CSS (:target) muestra ese estado
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const original = campo.value.trim();
  if (!original) { campo.focus(); return; }

  // 1. Privacidad: lo que viajaría al modelo ya va sin datos personales
  const segura = protegerDatos(original);
  const ocultos = contarOcultos(original);

  // 2. Alto impacto: no se consulta al modelo, va a una persona
  const motivo = motivoHumano(original);
  if (motivo) {
    escribirPregunta("delicado", segura, ocultos);
    document.getElementById("delicado-titulo").textContent = MENSAJES_HUMANO[motivo].titulo;
    document.getElementById("delicado-texto").textContent = MENSAJES_HUMANO[motivo].texto;
    irA("delicado");
    campo.value = "";
    return;
  }

  // 3. Pregunta normal: «Buscando…» y luego el resultado.
  //    Sin modelo conectado, solo la pregunta de flexbox tiene respuesta
  //    en la maqueta; para el resto, el asistente admite que no sabe.
  const tieneRespuesta = /flex|centr/i.test(original);
  const destino = tieneRespuesta ? "respuesta" : "error";
  escribirPregunta("cargando", segura, ocultos);
  escribirPregunta(destino, segura, ocultos);
  if (!tieneRespuesta) {
    document.querySelector("#error .titulo-msg").textContent =
      "No encuentro eso en la documentación que tengo.";
    document.querySelector("#error li").textContent =
      "Reformular la pregunta con más detalle o con un ejemplo de tu código.";
  }
  irA("cargando");
  setTimeout(() => irA(destino), 1600);
  campo.value = "";
});

pintarAvisos();
