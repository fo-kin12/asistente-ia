# Asistente Dev · Maqueta (Semana 1)

Prototipo en HTML y CSS de un **asistente de conocimiento para desarrolladores**: responde dudas de programación (HTML, CSS, JavaScript, Git, bases de datos) citando la documentación oficial. Todavía no hay un modelo conectado: es la maqueta.

Abre la carpeta en VS Code, haz clic derecho en `index.html` → **Open with Live Server** (o ábrelo en el navegador) y mira cómo los estados **cambian solos cada 4 segundos** en la misma pantalla (vacío → cargando → respuesta → error → tema delicado → mentor), sin JavaScript. Toca un paso del indicador para dejarlo fijo y **▶ Automático** para volver a reproducir.

## Presentación

📽️ [Ver la presentación del reto (PDF)](docs/presentacion-semana1.pdf): versión corta para una exposición de 5 minutos (7 diapositivas).

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

## Checklist del reto

- [x] Aviso de límites visible (`.aviso`)
- [x] Mensaje del dev (`.mensaje.usuario`), alineado a la derecha
- [x] Respuesta con fuente y enlace (`.fuente`), con bloque de código (`.codigo`)
- [x] Mensaje de error o «no sé» (`.mensaje.asistente.error`)
- [x] Formulario con `label`, campo y botón
- [x] Salida a una persona (`.humano`), siempre visible en la cabecera
- [x] Los cuatro estados: vacío, cargando, respuesta con fuente y error
- [x] Extra: temas delicados (credenciales, producción) derivados a un mentor
- [x] Extra: los estados cambian solos en una sola pantalla (solo CSS)

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
