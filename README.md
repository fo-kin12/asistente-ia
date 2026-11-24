# Asistente del clan · Maqueta (Semana 1)

Prototipo en HTML y CSS del asistente de conocimiento. Todavía no hay un modelo conectado: es la maqueta.
Abre la carpeta en VS Code, haz clic derecho en `index.html` → **Open with Live Server** (o ábrelo en el navegador) y usa la barra «Ver estado» para recorrer los estados.

## Caso de uso

Un coder tiene una duda sobre el curso (horarios, entregas, reglas) y quiere una respuesta corta que pueda verificar.

## Flujo de interacción

```
[Entra al asistente]
        │
        ▼
1. VACÍO ── ve el aviso de límites, el botón «Hablar con un coach» y 3 sugerencias
        │  escribe en el campo (con ejemplo) o toca una sugerencia
        ▼
2. CARGANDO ── «Pensando…» (nunca pantalla en blanco)
        │
        ├──► 3. RESPUESTA ── respuesta corta + fuente con enlace + 👍/👎
        │          └─ si no le sirve ──► coach
        │
        ├──► 4. ERROR / «NO SÉ» ── mensaje honesto, sin inventar
        │          └─ salidas: reformular la pregunta o hablar con un coach
        │
        └──► 5. TEMA DELICADO ── no responde la IA; deriva siempre a una persona
                   └─► COACH
```

## Checklist del reto

- [x] Aviso de límites visible (`.aviso`)
- [x] Mensaje del coder (`.mensaje.usuario`), alineado a la derecha
- [x] Respuesta con fuente y enlace (`.fuente`)
- [x] Mensaje de error o «no sé» (`.mensaje.asistente.error`)
- [x] Formulario con `label`, campo y botón
- [x] Salida a una persona (`.humano`), siempre visible en la cabecera
- [x] Los cuatro estados: vacío, cargando, respuesta con fuente y error
- [x] Extra: derivación de temas delicados

## Prueba con otro equipo

**Tarea que les damos:** «Averigua cuándo es la sesión de IA y comprueba de dónde sale el dato. Luego pregunta si puedes entregar tarde.»

**Reglas:** observar sin ayudar, sin explicar la interfaz, y anotar dónde dudan.

| # | Qué observamos | Dónde dudaron | Cambio que hicimos |
|---|----------------|---------------|--------------------|
| 1 |                |               |                    |
| 2 |                |               |                    |
| 3 |                |               |                    |

**Preguntas al final:**
1. ¿Supiste de dónde salió la respuesta?
2. ¿Te diste cuenta de que era una IA y podía fallar?
3. Si la respuesta no te servía, ¿sabías qué hacer?

Después de corregir, volvemos a probar con la misma tarea.
