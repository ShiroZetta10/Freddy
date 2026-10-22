// Equipo Shiro (Zetta10 · Talento Canario). Datos tomados de sus perfiles públicos de GitHub y LinkedIn.
// Solo enlaces profesionales; no se publican emails ni redes personales.

export type Miembro = {
  nombre: string
  rol: string
  detalle: string
  github?: string // usuario de GitHub
  linkedin?: string // URL completa
  web?: string
}

export const EQUIPO: Miembro[] = [
  {
    nombre: 'Esther Medina Quintero',
    rol: 'Data & AI Engineer · Project Manager',
    detalle: 'Coordinación del equipo, datos e IA. Tenerife.',
    github: 'EstherMQuinteroDataX',
    linkedin: 'https://www.linkedin.com/in/esther-medina-quintero',
  },
  {
    nombre: 'Enrique Ghijs Mora',
    rol: 'Fullstack Developer · Antropólogo',
    detalle: 'Consultor de innovación. HTML, CSS, JavaScript, React y Figma. Canarias.',
    github: 'Bees7nees',
    linkedin: 'https://www.linkedin.com/in/enrique-ghijs-mora-39b883219',
  },
  {
    nombre: 'Enrique Gómez Díaz',
    rol: 'Ingeniería Informática · Universidad de La Laguna',
    detalle: 'Estudiante de Ingeniería Informática. San Cristóbal de La Laguna.',
    github: 'EnriqueGD08',
    linkedin: 'https://www.linkedin.com/in/enrique-g%C3%B3mez-ba4969245',
    web: 'https://enriquegd08.github.io/enrique-portfolio',
  },
  {
    nombre: 'Raúl González Acosta',
    rol: 'Ingeniería Informática · Universidad de La Laguna',
    detalle: 'Estudiante de Ingeniería Informática. San Cristóbal de La Laguna.',
    github: 'raul-glezz',
    web: 'https://rgkdev.tech',
  },
]

export const REPO = 'https://github.com/ShiroZetta10/Freddy'
