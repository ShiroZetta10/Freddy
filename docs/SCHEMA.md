# Esquema común de salida (JSON) — benchmark Zetta10 / Fred. Olsen Click & Collect

Escribe un único archivo JSON válido (UTF-8) con esta forma:

{
  "benchmark": "A" | "B",
  "grupo": "<nombre del bloque investigado>",
  "generado": "2026-10-22",
  "verticales": [ {"id": "...", "nombre": "...", "descripcion": "..."} ],
  "empresas": [
    {
      "id": "slug-sin-espacios",
      "nombre": "Nombre",
      "sector": "naviera | ferrocarril | aerolinea | crucero | estadio | restauracion | aeropuerto | plataforma-tech | otro",
      "pais": "...",
      "logo_texto": "2-3 letras para avatar",
      "resumen": "2-3 frases: qué es y por qué es relevante para el reto",
      "click_collect": "Descripción concreta de su servicio de pedido móvil / at-seat / click & collect (o 'No tiene' si no existe)",
      "evaluacion": {
        "<id_vertical>": {
          "puntuacion": 1-5 (entero; 0 si no hay info),
          "evidencia": "qué hace exactamente (1-3 frases)",
          "fuente": "URL principal"
        }
      },
      "buenas_practicas": ["práctica concreta y replicable", "..."],
      "datos_clave": [ {"etiqueta": "...", "valor": "...", "fuente": "URL"} ],
      "aplicacion_fred_olsen": "Cómo trasladaríamos lo mejor de esta empresa al Click & Collect del Bajamar Express (sin aumentar plantilla)",
      "riesgos_o_limites": "qué NO copiar o qué no encaja en un barco de 80 min",
      "confianza": "alta | media | baja"
    }
  ],
  "tendencias": [ {"titulo": "...", "descripcion": "...", "fuente": "URL"} ],
  "insights": [ {"titulo": "...", "descripcion": "...", "accion_para_solucion": "..."} ],
  "fuentes": ["URL", "..."]
}

Rúbrica de puntuación (1-5):
1 = no existe / muy pobre · 2 = básico · 3 = correcto, estándar del sector · 4 = destacado · 5 = referente / best-in-class.
0 = sin información verificable (no inventar).

Reglas: solo hechos con fuente (preferir fuentes primarias, prensa especializada, casos de éxito de proveedores). Marca en "evidencia" con "[I]" cualquier inferencia. No inventes cifras. Idioma: español.
