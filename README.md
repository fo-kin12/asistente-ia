# Asistente Dev · Maqueta (Semana 1)

Prototipo en HTML y CSS de un **asistente de conocimiento para desarrolladores**: responde dudas de programación (HTML, CSS, JavaScript, Git, bases de datos) citando la documentación oficial. Todavía no hay un modelo conectado: es la maqueta.

Abre la carpeta en VS Code, haz clic derecho en `index.html` → **Open with Live Server** (o ábrelo en el navegador) y mira cómo los estados **cambian solos cada 4 segundos** en la misma pantalla (vacío → cargando → respuesta → error → tema delicado → mentor), solo con CSS. **Escribe una pregunta** para probar las reglas de uso responsable de la semana 2. Para que responda Claude de verdad, mira [Conectar Claude](#-conectar-claude-respuestas-reales). Toca un paso del indicador para dejarlo fijo y **▶ Reproducir solo** para volver al ciclo.

## 🤖 Conectar Claude (respuestas reales)

Asistente Dev puede responder con **Claude** a través de un servidor propio. La clave de la API vive en el servidor y **nunca llega al navegador**.

```
Página  ──/api/preguntar──►  server.js (reglas + clave en .env)  ──►  API de Claude
        ◄──── respuesta ────                                      ◄──
```

**1. Crea tu clave** en la consola de Claude: https://platform.claude.com (la API se paga por uso, aparte de claude.ai).

**2. Crea el archivo `.env`** copiando `.env.example` y pon tu clave:

```
ANTHROPIC_API_KEY=tu-clave-aquí
```

**3. Arranca el servidor** (Node.js 18 o superior, sin instalar paquetes):

```bash
npm start        # o: node server.js
```

**4. Abre** http://localhost:3000. La insignia de la ventana dice **● Claude conectado**.

> Si abres la página con Live Server o sin clave, funciona en **modo maqueta** (respuestas de ejemplo).

**Qué hace el servidor:**
- Vuelve a aplicar las reglas de la semana 2: oculta datos y no envía a Claude los temas de alto impacto.
- Le da a Claude sus instrucciones (prompt de sistema): respuestas cortas, citar documentación oficial, decir «no sé» en vez de inventar, no decidir sobre personas, salud, dinero ni producción.
- Valida la respuesta: solo enlaces `https`, texto plano (sin HTML), límites de tamaño.
- Solo sirve `index.html`, `css/`, `js/` y `docs/`: el `.env` y el `server.js` no se pueden abrir desde el navegador.
- No guarda ni registra el contenido de las preguntas.

> Las fuentes las cita el propio modelo. En la etapa de **recuperación con fuentes (RAG)** del macro reto, saldrán de nuestros propios documentos.

## Semana 2 · IA responsable desde el inicio

**Reto:** «Tres situaciones, tres decisiones». La evidencia es la lista de decisiones de uso responsable aplicada al asistente: 📄 **[DECISIONES.md](DECISIONES.md)**.

Las decisiones se convirtieron en código ([`js/reglas.js`](js/reglas.js)) y el formulario ya las usa ([`js/app.js`](js/app.js)):

| Regla | Función | Qué hace en la interfaz |
|---|---|---|
| 🔒 Privacidad | `protegerDatos(texto)` | Oculta correos, celulares, documentos, contraseñas y tokens antes de enviar, y avisa cuántos datos protegió |
| 🙋 Alto impacto | `requiereHumano(pregunta)` | Salud, dinero, notas, decisiones sobre personas o producción → «Tema delicado» y mentor, sin consultar al modelo |
| 📢 Divulgación | `aviso(fuentes)` | Bajo cada respuesta: «Respuesta generada con IA a partir de N fuentes: …»; sin fuentes, lo advierte |

Pruebas (las 7 misiones del laboratorio y 6 propias para devs):

```bash
node tests/reglas.test.js
```

## Estructura

```
asistente-ia/
├── server.js           # servidor: reglas + conexión segura con Claude
├── .env.example        # plantilla para tu clave (el .env real no se sube)
├── package.json        # npm start / npm test
├── index.html          # la interfaz (estados, formulario, reglas visibles)
├── css/styles.css      # diseño y ciclo automático de estados (solo CSS)
├── js/reglas.js        # semana 2: protegerDatos, requiereHumano, aviso
├── js/app.js           # conecta el formulario con las reglas y con el servidor
├── tests/reglas.test.js
├── DECISIONES.md       # semana 2: evidencia (lista de decisiones)
├── README.md
└── docs/presentacion-semana1.pdf
```

## Presentación

📽️ [Ver la presentación del reto (PDF)](docs/presentacion-semana1.pdf): versión corta para una exposición de 5 minutos (7 diapositivas).

## Diseño de la interfaz

El chat vive dentro de una **ventana de editor de código**, el entorno natural de un desarrollador:

- **Números de línea** en un canal a la izquierda, como en VS Code (contador CSS).
- **Código con colores de sintaxis** y la fuente en una caja cian, separada de la respuesta.
- El **aviso de límites** aparece como una advertencia de linter, con subrayado ondulado.
- La **línea de tiempo** de la izquierda resalta el estado activo y su barra se llena en 4 s.
- Paleta índigo con violeta (dev), cian (código y fuentes), ámbar (persona/mentor) y coral (error).
- Tipografías: Bricolage Grotesque (interfaz) y JetBrains Mono (código).

## Mercado y caso de uso

**Para quién:** desarrolladores junior y equipos de software que necesitan respuestas rápidas, pero verificables, mientras programan.

**Caso de uso:** un dev tiene una duda técnica («¿cómo centro un div con flexbox?») y quiere una respuesta corta, con código listo para probar y el enlace a la documentación de donde sale.

**Por qué importa el diseño:** en programación una respuesta inventada se convierte en un bug. Por eso el asistente muestra la fuente, admite cuando no sabe, no acepta credenciales y siempre ofrece hablar con un mentor.

## Flujo de interacción

```
[Entra al asistente]
        │
        ▼
1. VACÍO ── ve el aviso de límites, el botón «Hablar con un mentor» y 3 sugerencias
        │  escribe en el campo (con ejemplo) o toca una sugerencia
        ▼
2. CARGANDO ── «Buscando en la documentación…» (nunca pantalla en blanco)
        │
        ├──► 3. RESPUESTA ── explicación corta + código + fuente (MDN) + 📋 Copiar + 👍/👎
        │          └─ si no le sirve ──► mentor
        │
        ├──► 4. ERROR / «NO SÉ» ── no encuentra la doc; no inventa endpoints
        │          └─ salidas: revisar el changelog o hablar con un mentor
        │
        └──► 5. TEMA DELICADO ── credenciales o datos de producción: no los procesa
                   └─► 6. MENTOR (una persona del equipo)
```

## Checklist semana 1

- [x] Aviso de límites visible (`.aviso`)
- [x] Mensaje del dev (`.mensaje.usuario`), alineado a la derecha
- [x] Respuesta con fuente y enlace (`.fuente`), con bloque de código (`.codigo`)
- [x] Mensaje de error o «no sé» (`.mensaje.asistente.error`)
- [x] Formulario con `label`, campo y botón
- [x] Salida a una persona (`.humano`), siempre visible en la cabecera
- [x] Los cuatro estados: vacío, cargando, respuesta con fuente y error
- [x] Extra: temas delicados (credenciales, producción) derivados a un mentor
- [x] Extra: los estados cambian solos en una sola pantalla (solo CSS)

## Checklist semana 2

- [x] Tres situaciones evaluadas: dato privado, respuesta sesgada y recomendación de alto impacto ([DECISIONES.md](DECISIONES.md))
- [x] Oculta correo, celular colombiano y documento (sin tocar números cortos)
- [x] Detecta temas de alto impacto y deriva a una persona
- [x] El aviso cuenta y nombra las fuentes; sin fuentes, advierte
- [x] Las reglas funcionan en la interfaz y tienen pruebas

## Prueba con otro equipo

**Tarea que les damos:** «Averigua cómo centrar un div con flexbox y comprueba de dónde sale la respuesta. Luego pregunta qué cambió en la v5 de la API interna.»

**Reglas:** observar sin ayudar, sin explicar la interfaz, y anotar dónde dudan.

| # | Qué observamos | Dónde dudaron | Cambio que hicimos |
|---|----------------|---------------|--------------------|
| 1 |                |               |                    |
| 2 |                |               |                    |
| 3 |                |               |                    |

**Preguntas al final:**
1. ¿Supiste de qué documentación salió la respuesta?
2. ¿Te diste cuenta de que era una IA y podía fallar?
3. Si la respuesta no te servía, ¿sabías qué hacer?

Después de corregir, volvemos a probar con la misma tarea.
