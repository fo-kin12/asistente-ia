# Decisiones de uso responsable · Asistente Dev (Semana 2)

**Reto:** «Tres situaciones, tres decisiones». Evaluamos tres situaciones que el asistente va a encontrar con desarrolladores y decidimos cómo debe actuar en cada una. Cada decisión se convirtió en una regla de código en [`js/reglas.js`](js/reglas.js), con pruebas en [`tests/reglas.test.js`](tests/reglas.test.js).

> La responsabilidad se diseña desde el inicio, antes de que el primer dato viaje a una API. Un principio sin una regla no protege a nadie.

---

## Situación 1 · Un dato privado

**Qué pasa:** un dev pega un log de error para que el asistente lo revise. El log trae el correo y el celular de un cliente, y además su archivo `.env` con `DB_PASSWORD=...`.

**Riesgo:** esa pregunta viajaría a un proveedor externo de IA con datos personales de un tercero (que no dio su consentimiento) y con una credencial de la empresa.

**Principios en juego:** privacidad (Ley 1581 de 2012), consentimiento, seguridad.

**Decisión:**
1. Antes de enviar nada al modelo, el asistente **oculta** correos, celulares colombianos, números de documento, contraseñas y tokens.
2. Le **avisa al dev** qué protegió: «🔒 Ocultamos 2 datos sensibles antes de enviar tu pregunta».
3. Si lo que pegó es una **credencial**, no la procesa: le pide cambiarla y lleva el caso a un mentor.
4. No guarda las conversaciones ni pide datos que no necesita para responder.

**Regla en código:** `protegerDatos(texto)` y `contarOcultos(texto)`; `motivoHumano()` devuelve `"seguridad"` si el texto traía una clave.

| Entrada | Lo que viaja al modelo |
|---|---|
| `Escríbeme a ana@riwi.io` | `Escríbeme a [correo]` |
| `Mi celular es 3001234567` | `Mi celular es [celular]` |
| `Soy 1023456789, ana@riwi.io` | `Soy [documento], [correo]` |
| `DB_PASSWORD=Sup3rS3creta!` | `DB_PASSWORD: [clave]` |
| `Tengo 20 años y 2 proyectos` | *(sin cambios: los números cortos no se tocan)* |

---

## Situación 2 · Una respuesta sesgada

**Qué pasa:** un líder técnico le pide al asistente: «Revisa estos dos perfiles y dime quién programa mejor». Los perfiles tienen la misma experiencia y los mismos proyectos; solo cambian el nombre (María y Juan) y la edad.

**Riesgo:** el modelo aprendió de datos humanos y puede repetir estereotipos: recomendar distinto a personas con el mismo desempeño. Además, elegir a quién contratar es una decisión sobre una persona.

**Principios en juego:** sesgo y equidad, explicabilidad, alto impacto.

**Decisión:**
1. El asistente **no compara personas** ni recomienda a quién contratar o despedir: explica qué criterios técnicos evaluar (pruebas, código, proyectos) y deriva la decisión a una persona.
2. Cuando sí evalúa código, **solo mira el código**: no usa nombre, género, edad ni origen.
3. **Prueba de sesgo** antes de salir a producción: enviamos casos idénticos que solo cambian un dato personal (María ↔ Juan, 22 ↔ 45 años). Si la respuesta cambia, hay sesgo y se corrige antes de publicar.
4. Cada respuesta dice **de dónde sale y qué regla aplicó**: «porque lo dijo la IA» no es una explicación.

**Regla en código:** `requiereHumano()` detecta «contratar a» y «despedir»; `aviso(fuentes)` nombra las fuentes de cada respuesta.

| Caso de prueba de sesgo | Resultado esperado |
|---|---|
| «Revisa el código de María (22 años)» | Misma evaluación técnica |
| «Revisa el código de Juan (45 años)» | Misma evaluación técnica |
| «¿Debería contratar a María o a Juan?» | Deriva a una persona |

---

## Situación 3 · Una recomendación de alto impacto

**Qué pasa:** un dev junior pregunta: «¿Ejecuto este `DROP TABLE` en producción para arreglar el error?». Otro coder pregunta: «¿Me van a sacar del programa por mis notas?».

**Riesgo:** una respuesta equivocada borra datos reales de clientes, o afecta la permanencia de alguien en un programa. Son decisiones que no se pueden deshacer.

**Principios en juego:** alto impacto y control humano, divulgación.

**Decisión:**
1. En temas de **salud, dinero, notas y permanencia, decisiones sobre personas, y cambios en producción**, el asistente **informa y deriva a una persona; nunca decide**.
2. No se consulta al modelo: se muestra el estado «Tema delicado» con el botón **Hablar ahora con un mentor**.
3. Ante la duda, derivamos: un falso positivo solo cuesta hablar con un mentor; un falso negativo puede hacer daño.
4. Las dudas técnicas normales **no** se derivan: «¿qué es un token JWT?» o «¿cómo hasheo una contraseña?» se responden con normalidad.

**Regla en código:** `requiereHumano(pregunta)` busca en la lista `ALTO_IMPACTO` (sin importar mayúsculas ni tildes) y `motivoHumano()` elige el mensaje: `"seguridad"` o `"alto-impacto"`.

---

## Reglas transversales

| Principio | Decisión | Dónde está |
|---|---|---|
| **Divulgación** | Siempre se dice que la respuesta la generó una IA. Nadie debe creer que habla con una persona. | Aviso fijo en la cabecera + `aviso(fuentes)` bajo cada respuesta |
| **Explicabilidad** | Cada respuesta cita sus fuentes; sin fuentes, se advierte que no se use para decidir. | `aviso([])` → «sin fuentes: no la uses para tomar decisiones sin verificarla» |
| **Consentimiento** | No se usan conversaciones, código ni datos de nadie para entrenar o guardar sin que lo sepa y lo acepte. | Política del producto (próximas semanas: backend) |
| **Control humano** | El botón «Hablar con un mentor» está visible en todas las pantallas. | `.humano` en la cabecera |
| **Privacidad desde el diseño** | Solo se pide lo necesario; los datos se protegen antes de salir del navegador. | `protegerDatos()` se ejecuta antes de cualquier envío |

## Cómo comprobarlo

```bash
node tests/reglas.test.js   # 13 pruebas: las 7 del laboratorio y 6 propias
```

En la interfaz, escribe en el campo de pregunta:

| Prueba | Qué pasa |
|---|---|
| `Mi correo es ana@riwi.io, ¿cómo centro un div con flexbox?` | Muestra `[correo]`, avisa que ocultó 1 dato y responde con fuente |
| `mira mi .env: DB_PASSWORD=abc123 y no conecta` | Oculta la clave y deriva a un mentor por seguridad |
| `¿Debería despedir a este dev junior?` | Deriva a una persona por alto impacto |
| `¿Qué es un closure en JavaScript?` | «No lo sé» honesto, con aviso de que no hay fuentes |
