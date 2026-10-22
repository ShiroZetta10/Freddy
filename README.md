# Shiro · Click & Collect a bordo (Zetta10 × Fred. Olsen Express)

Web interactiva del equipo **Shiro** para el reto «Click & Collect a bordo» del hackathon Zetta10 (Talento Canario).

- **Benchmark A · Navieras**: Fred. Olsen frente a 12 navieras de Canarias y Europa.
- **Benchmark B · Click & Collect**: 26 referentes de trenes, aviones, cruceros, estadios, restauración y plataformas.
- **Datos Bajamar**: gráficos con las ventas de ene–abr 2026.
- **Ranking y radar**: puntuación con los pesos del jurado (ajustables).
- **Del benchmark a la solución**: las 8 preguntas del reto → referentes → propuesta → KPI.
- **Simulador**: impacto estimado sobre la facturación.
- **/app**: espacio reservado para el prototipo de la app (misma base de código).

## Stack
Vite + React 18 + TypeScript + Recharts. HashRouter (las rutas funcionan en GitHub Pages sin configurar nada).
Elegido para que la **app de Click & Collect** se construya en el mismo repo y comparta diseño y datos.

## Desarrollo local
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
```

## Editar el contenido
- Benchmarks: `src/data/benchmark_*.json` (esquema en `docs/SCHEMA.md`).
- Datos del Bajamar: `src/data/bajamar.ts`.
- Retos → solución: `src/data/retos.ts`.

## Publicar en GitHub Pages
1. Crea el repo en GitHub (p. ej. `shiro-click-collect`) y súbelo:
   ```bash
   git init -b main
   git add .
   git commit -m "Benchmark interactivo Click & Collect"
   git remote add origin https://github.com/<usuario-u-org>/shiro-click-collect.git
   git push -u origin main
   ```
2. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. El workflow `.github/workflows/deploy.yml` compila y publica en cada push a `main`.
   La web queda en `https://<usuario-u-org>.github.io/shiro-click-collect/`.

> GitHub Pages es gratis en repos públicos. En repos privados requiere un plan de pago (Pro/Team).
