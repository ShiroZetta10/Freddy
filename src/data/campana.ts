// Campaña de lanzamiento de FredOnBoard: piezas diseñadas (cartelería, redes y canales digitales).
// Las imágenes viven en public/campana/ y se exportan desde el lienzo de diseño de la campaña.
// Reglas de la campaña: sin asientos asignados («sin levantarte», «desde tu mesa»), la barra sigue igual,
// sin precios ni descuentos (Tarifa Joven = «Próximamente»), QR real al prototipo del pasajero.

export type GrupoCampana = 'A' | 'B' | 'C' | 'D'
export type FaseCampana = 'teaser' | 'lanzamiento' | 'refuerzo'

export type VarianteCampana = { nombre: string; imgs: string[] }

export type PiezaCampana = {
  id: string
  grupo: GrupoCampana
  titulo: string
  copy: string
  formato: string
  donde: string
  semana: string
  fase: FaseCampana
  variantes: VarianteCampana[]
}

export const GRUPOS_CAMPANA: { id: GrupoCampana; nombre: string }[] = [
  { id: 'A', nombre: 'Cartelería a bordo' },
  { id: 'B', nombre: 'Redes sociales' },
  { id: 'C', nombre: 'Canales digitales' },
  { id: 'D', nombre: 'Variantes por público' },
]

export const FASES_CAMPANA: { id: FaseCampana; nombre: string; cuando: string }[] = [
  { id: 'teaser', nombre: 'Teaser', cuando: 'Semana −1' },
  { id: 'lanzamiento', nombre: 'Lanzamiento', cuando: 'Semana 1' },
  { id: 'refuerzo', nombre: 'Refuerzo', cuando: 'Semanas 2–4' },
]

const img = (n: string) => `campana/${n}.webp`
const serie = (n: string, k: number) => Array.from({ length: k }, (_, i) => img(`${n}-${i + 1}`))
const dos = (n: string): VarianteCampana[] => [
  { nombre: 'V1 · Luz', imgs: [img(`${n}-v1`)] },
  { nombre: 'V2 · Mar', imgs: [img(`${n}-v2`)] },
]

export const HOJA_ESTILO = img('hoja-de-estilo')

export const PIEZAS_CAMPANA: PiezaCampana[] = [
  { id: 'A1', grupo: 'A', titulo: 'Tarjeta de mesa', copy: 'Pide sin levantarte · Escanea, elige y recoge sin colas', formato: 'A6 vertical, 105×148 mm + 3 mm de sangrado', donde: 'Mesas del salón del Bajamar Express (portamenús)', semana: 'Semana 1; se mantiene en semanas 2–4', fase: 'lanzamiento', variantes: dos('A1-tarjeta') },
  { id: 'A2', grupo: 'A', titulo: 'Cartel de barra · punto de recogida', copy: 'Recogida FredOnBoard · Enseña tu código y listo · Order pick-up · Abholung', formato: 'A3 vertical, 297×420 mm + 3 mm de sangrado; titular legible a 2 m', donde: 'Frente de la barra, zona de recogida', semana: 'Semanas 1–4', fase: 'lanzamiento', variantes: dos('A2-barra') },
  { id: 'A3', grupo: 'A', titulo: 'Mupi en la terminal', copy: 'Tu café, listo cuando tú lo estés · Pídelo antes de embarcar y recógelo sin colas', formato: 'Mupi 1185×1750 mm + 3 mm (maquetado a escala 1:5)', donde: 'Terminal de Santa Cruz de Tenerife, embarque a Agaete', semana: 'Semana 1; en refuerzo rotan las variantes por público', fase: 'lanzamiento', variantes: dos('A3-mupi') },
  { id: 'A4', grupo: 'A', titulo: 'Pegatina de mesa', copy: 'Pide aquí · Escanea y pide', formato: 'Redonda Ø 90 mm + 3 mm, vinilo laminado mate', donde: 'Mesas redondas y repisas junto a las ventanas', semana: 'Semana 1; se repone en semanas 2–4', fase: 'lanzamiento', variantes: dos('A4-pegatina') },
  { id: 'B5', grupo: 'B', titulo: 'Teaser en Instagram', copy: 'Algo se cocina a bordo del Bajamar Express', formato: 'Post 1:1, 1080×1080', donde: 'Feed de Instagram de Fred. Olsen Express', semana: 'Semana −1', fase: 'teaser', variantes: dos('B5-teaser') },
  { id: 'B6', grupo: 'B', titulo: 'Carrusel de lanzamiento', copy: 'Ya puedes pedir sin levantarte → 3 pasos → Pruébalo en tu próximo viaje a Agaete', formato: 'Carrusel 4:5, 1080×1350 × 5 diapositivas', donde: 'Feed de Instagram', semana: 'Semana 1, día de salida del piloto', fase: 'lanzamiento', variantes: [{ nombre: 'V1 · Luz', imgs: serie('B6-carrusel-v1', 5) }, { nombre: 'V2 · Mar', imgs: serie('B6-carrusel-v2', 5) }] },
  { id: 'B7', grupo: 'B', titulo: 'Story / TikTok para vídeo corto', copy: 'POV: son las 8, estás en el barco y tu café ya está pedido → aviso → recogida', formato: 'Story 9:16, 1080×1920 × 3 viñetas', donde: 'Stories de Instagram y TikTok', semana: 'Semana 1; repetición en semana 2', fase: 'lanzamiento', variantes: [{ nombre: 'V1 · Luz', imgs: serie('B7-story-v1', 3) }, { nombre: 'V2 · Mar', imgs: serie('B7-story-v2', 3) }] },
  { id: 'B8', grupo: 'B', titulo: 'Facebook para residentes', copy: 'Desde hoy, en el Bajamar Express: pide sin levantarte y recoge sin colas. La barra de siempre sigue atendiendo igual', formato: 'Post 1200×630', donde: 'Página de Facebook de Fred. Olsen Express', semana: 'Semana 1', fase: 'lanzamiento', variantes: dos('B8-facebook') },
  { id: 'B9', grupo: 'B', titulo: 'LinkedIn corporativo', copy: 'Talento canario a bordo: un equipo de Zetta10 pone a prueba en el Bajamar Express una forma nueva de pedir a bordo', formato: 'Post 1200×627', donde: 'Página corporativa en LinkedIn', semana: 'Semana 1', fase: 'lanzamiento', variantes: dos('B9-linkedin') },
  { id: 'B10', grupo: 'B', titulo: 'Hecho en Canarias, pedido en dos toques', copy: 'Café con leche canaria, plátano, queso de Tenerife, cerveza canaria; en la tienda, mojo, gofio y miel', formato: 'Carrusel 4:5, 1080×1350 × 4 diapositivas', donde: 'Feed de Instagram y Facebook', semana: 'Semanas 2–3', fase: 'refuerzo', variantes: [{ nombre: 'V1 · Luz', imgs: serie('B10-canarias-v1', 4) }, { nombre: 'V2 · Mar', imgs: serie('B10-canarias-v2', 4) }] },
  { id: 'C11', grupo: 'C', titulo: 'Banner del portal wifi On Board Club', copy: 'Tu pedido de hoy, a un toque · Pedir ahora', formato: 'Escritorio 1200×400 y móvil 750×500', donde: 'Portada del portal On Board Club', semana: 'Semanas 1–4', fase: 'lanzamiento', variantes: [{ nombre: 'V1 · Luz', imgs: [img('C11-banner-v1-escritorio'), img('C11-banner-v1-movil')] }, { nombre: 'V2 · Mar', imgs: [img('C11-banner-v2-escritorio'), img('C11-banner-v2-movil')] }] },
  { id: 'C12', grupo: 'C', titulo: 'WhatsApp de recordatorio del check-in', copy: 'Hola, Carmen: ya falta poco para tu viaje a Agaete. Ahora puedes pedir tu desayuno antes de embarcar y recogerlo sin colas → [enlace]', formato: 'Vista de móvil (datos de ejemplo, no reales)', donde: 'WhatsApp de la naviera, 24 h antes del viaje', semana: 'Semanas 1–4', fase: 'lanzamiento', variantes: dos('C12-whatsapp') },
  { id: 'C13', grupo: 'C', titulo: 'Cabecera del email de confirmación', copy: 'Tu viaje empieza antes: pide tu desayuno y recógelo sin colas', formato: '600×200 (exportar a 1200×400 @2x)', donde: 'Email de confirmación de compra del billete', semana: 'Semanas 1–4', fase: 'lanzamiento', variantes: dos('C13-email') },
  { id: 'D1', grupo: 'D', titulo: 'Residente frecuente', copy: 'Tu café, listo cuando tú lo estés', formato: 'Mupi (escala 1:5) y story 1080×1920', donde: 'Terminal de Santa Cruz y stories segmentadas', semana: 'Semanas 2–4', fase: 'refuerzo', variantes: [{ nombre: 'Mupi', imgs: [img('D-mupi-residente')] }, { nombre: 'Story', imgs: [img('D-story-residente')] }] },
  { id: 'D2', grupo: 'D', titulo: 'Joven con Tarifa Joven', copy: 'El viaje, a tu ritmo · Pide sin moverte del grupo · Próximamente: ventaja Tarifa Joven', formato: 'Mupi (escala 1:5) y story 1080×1920', donde: 'Terminal de Santa Cruz y stories segmentadas', semana: 'Semanas 2–4', fase: 'refuerzo', variantes: [{ nombre: 'Mupi', imgs: [img('D-mupi-joven')] }, { nombre: 'Story', imgs: [img('D-story-joven')] }] },
  { id: 'D3', grupo: 'D', titulo: 'Turista (EN / DE)', copy: 'Taste the islands · Order from your table. Collect without queuing · Bestelle am Tisch, hol ohne Warteschlange ab', formato: 'Mupi (escala 1:5) y story 1080×1920', donde: 'Terminal de Santa Cruz y stories segmentadas', semana: 'Semanas 2–4', fase: 'refuerzo', variantes: [{ nombre: 'Mupi', imgs: [img('D-mupi-turista')] }, { nombre: 'Story', imgs: [img('D-story-turista')] }] },
  { id: 'D4', grupo: 'D', titulo: 'Persona mayor que prefiere la barra', copy: 'La barra, como siempre · Pide con el trato de siempre. El móvil es solo una opción más', formato: 'Mupi (escala 1:5) y story 1080×1920', donde: 'Terminal de Santa Cruz y stories segmentadas', semana: 'Semanas 2–4', fase: 'refuerzo', variantes: [{ nombre: 'Mupi', imgs: [img('D-mupi-mayor')] }, { nombre: 'Story', imgs: [img('D-story-mayor')] }] },
]
