/* =========================================================
   Asistente Dev · Reglas de uso responsable (Semana 2)

   Las decisiones de la sesión convertidas en funciones que el
   asistente usa ANTES y DESPUÉS de hablar con el modelo:

     1. protegerDatos(texto)   → antes: oculta datos personales y claves
     2. requiereHumano(texto)  → antes: detecta temas de alto impacto
     3. aviso(fuentes)         → después: dice cómo se generó la respuesta

   «Un principio sin una regla no protege a nadie.»
   ========================================================= */

// ---------------------------------------------------------
// 1. PRIVACIDAD · Antes de enviar la pregunta al modelo,
//    oculta los datos personales (Ley 1581 de 2012) y,
//    por ser un asistente para devs, también las credenciales.
//    El orden importa: primero lo más específico.
// ---------------------------------------------------------
function protegerDatos(texto) {
  return texto
    // Contraseñas y secretos escritos como «password=...», «DB_PASSWORD=...»
    // o «contraseña: ...» (también variables de entorno con prefijo)
    .replace(/\b(\w*(?:contraseña|password|passwd|pwd|secret|api_?key|token))\s*[:=]\s*\S+/gi, "$1: [clave]")
    // Claves y tokens con prefijos típicos (sk-..., ghp_..., xoxb-...)
    .replace(/\b(sk|pk|rk|ghp|gho|github_pat|xox[abp])[-_][A-Za-z0-9_-]{10,}/g, "[clave]")
    // Correos electrónicos
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[correo]")
    // Celular colombiano: un 3 y nueve dígitos más (antes que los documentos)
    .replace(/\b3\d{9}\b/g, "[celular]")
    // Número de documento: de 6 a 10 dígitos seguidos
    .replace(/\b\d{6,10}\b/g, "[documento]");
}

// Cuántos datos se ocultaron (para avisarle al dev)
function contarOcultos(texto) {
  const coincidencias = protegerDatos(texto).match(/\[(clave|correo|celular|documento)\]/g);
  const yaVenian = texto.match(/\[(clave|correo|celular|documento)\]/g);
  return (coincidencias ? coincidencias.length : 0) - (yaVenian ? yaVenian.length : 0);
}

// ---------------------------------------------------------
// 2. ALTO IMPACTO · ¿El tema necesita a una persona?
//    Salud, educación, dinero, decisiones sobre personas y,
//    en desarrollo, credenciales o cambios en producción.
//    La IA puede informar; la decisión la toma una persona.
//    Si dudamos, derivamos: un falso positivo solo cuesta
//    hablar con un mentor; un falso negativo puede hacer daño.
// ---------------------------------------------------------
const ALTO_IMPACTO = [
  // Salud
  "dolor", "medicamento", "sintoma", "diagnostico",
  // Educación y permanencia
  "notas", "sacar del", "expulsar", "retirarme",
  // Dinero
  "dinero", "prestamo", "invertir",
  // Decisiones sobre personas
  "despedir", "contratar a",
  // Desarrollo: compartir credenciales o tocar producción.
  // Ojo: «token» o «password» solos son dudas técnicas normales
  // («¿qué es un token JWT?»), por eso buscamos frases concretas.
  "mi contraseña", "la contraseña de", "te paso la clave",
  "produccion", "drop table", "borrar la base"
];

// Minúsculas y sin tildes: «Diagnóstico» y «diagnostico» cuentan igual
function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function requiereHumano(pregunta) {
  const texto = normalizar(pregunta);
  return ALTO_IMPACTO.some((palabra) => texto.includes(normalizar(palabra)));
}

// Para elegir el mensaje correcto: ¿seguridad (credenciales/producción)
// o alto impacto general? Si el texto traía una clave, es seguridad.
const SEGURIDAD = ["mi contraseña", "la contraseña de", "te paso la clave",
                   "produccion", "drop table", "borrar la base"];
function motivoHumano(pregunta) {
  const texto = normalizar(pregunta);
  const traeClave = protegerDatos(pregunta).includes("[clave]");
  if (traeClave || SEGURIDAD.some((p) => texto.includes(normalizar(p)))) return "seguridad";
  if (requiereHumano(pregunta)) return "alto-impacto";
  return null;
}

// ---------------------------------------------------------
// 3. EXPLICABILIDAD Y DIVULGACIÓN · El aviso que va bajo
//    cada respuesta: dice que la generó una IA, cuenta y
//    nombra las fuentes. Sin fuentes, lo advierte.
// ---------------------------------------------------------
function aviso(fuentes) {
  if (fuentes.length === 0) {
    return "Respuesta generada con IA sin fuentes: no la uses para tomar decisiones sin verificarla.";
  }
  const palabra = fuentes.length === 1 ? "fuente" : "fuentes";
  return `Respuesta generada con IA a partir de ${fuentes.length} ${palabra}: ${fuentes.join(", ")}.`;
}

// Disponible en el navegador (window) y en Node (pruebas)
if (typeof module !== "undefined") {
  module.exports = { protegerDatos, contarOcultos, requiereHumano, motivoHumano, aviso, ALTO_IMPACTO };
}
