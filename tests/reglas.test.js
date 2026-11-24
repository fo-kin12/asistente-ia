// Pruebas de las reglas de uso responsable.
// Ejecutar con:  node tests/reglas.test.js
const assert = require("node:assert/strict");
const { protegerDatos, contarOcultos, requiereHumano, motivoHumano, aviso } = require("../js/reglas.js");

let ok = 0;
function prueba(nombre, fn) {
  try { fn(); ok++; console.log("✔", nombre); }
  catch (e) { console.error("✘", nombre, "\n ", e.message); process.exitCode = 1; }
}

// --- Misiones del laboratorio ---
prueba("1. Oculta un correo", () => {
  assert.equal(protegerDatos("Escríbeme a ana@riwi.io"), "Escríbeme a [correo]");
});
prueba("2. Oculta un celular colombiano", () => {
  assert.equal(protegerDatos("Mi celular es 3001234567"), "Mi celular es [celular]");
});
prueba("3. Oculta documento y correo en el mismo texto", () => {
  assert.equal(protegerDatos("Soy 1023456789, ana@riwi.io"), "Soy [documento], [correo]");
});
prueba("4. No toca los números cortos de una frase normal", () => {
  const frase = "Tengo 20 años y 2 proyectos";
  assert.equal(protegerDatos(frase), frase);
});
prueba("5. Detecta los temas de alto impacto", () => {
  assert.equal(requiereHumano("¿Qué medicamento tomo para el dolor?"), true);
  assert.equal(requiereHumano("¿Me van a sacar del programa por mis notas?"), true);
  assert.equal(requiereHumano("¿Cómo centro un div con flexbox?"), false);
});
prueba("6. El aviso cuenta y nombra las fuentes", () => {
  assert.equal(aviso(["MDN Web Docs", "web.dev"]),
    "Respuesta generada con IA a partir de 2 fuentes: MDN Web Docs, web.dev.");
  assert.equal(aviso(["MDN Web Docs"]),
    "Respuesta generada con IA a partir de 1 fuente: MDN Web Docs.");
});
prueba("7. Sin fuentes, el aviso advierte", () => {
  assert.match(aviso([]), /sin fuentes/);
});

// --- Reglas propias de un asistente para devs ---
prueba("Oculta contraseñas escritas en el código", () => {
  assert.equal(protegerDatos("DB_PASSWORD=Sup3rS3creta!"), "DB_PASSWORD: [clave]");
  assert.equal(protegerDatos("API_KEY = abc123xyz"), "API_KEY: [clave]");
  assert.equal(protegerDatos("password=Sup3rS3creta!"), "password: [clave]");
  assert.equal(protegerDatos("la contraseña: hola123 no funciona"), "la contraseña: [clave] no funciona");
});
prueba("Oculta tokens con prefijo", () => {
  assert.equal(protegerDatos("uso sk-abc123DEF456ghi789 en el fetch"), "uso [clave] en el fetch");
  assert.equal(protegerDatos("token ghp_A1b2C3d4E5f6G7h8I9"), "token [clave]");
});
prueba("Cuenta los datos ocultos", () => {
  assert.equal(contarOcultos("ana@riwi.io y 3001234567"), 2);
  assert.equal(contarOcultos("¿Cómo centro un div?"), 0);
});
prueba("Credenciales y producción van a una persona", () => {
  assert.equal(motivoHumano("Te paso la contraseña de producción"), "seguridad");
  assert.equal(motivoHumano("¿Ejecuto este DROP TABLE?"), "seguridad");
  assert.equal(motivoHumano("¿Debería despedir a este dev?"), "alto-impacto");
  assert.equal(motivoHumano("¿Qué es un closure?"), null);
  assert.equal(motivoHumano("mira mi .env: DB_PASSWORD=abc123"), "seguridad");
});
prueba("Las dudas técnicas sobre tokens o contraseñas no se derivan", () => {
  assert.equal(motivoHumano("¿Qué es un token JWT?"), null);
  assert.equal(motivoHumano("¿Cómo hasheo una contraseña con bcrypt?"), null);
});
prueba("Funciona con o sin tildes", () => {
  assert.equal(requiereHumano("necesito un diagnostico"), true);
  assert.equal(requiereHumano("necesito un DIAGNÓSTICO"), true);
});

console.log(`\n${ok} pruebas superadas`);
