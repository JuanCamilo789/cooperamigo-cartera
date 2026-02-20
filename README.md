# Cooperamigó — Gestión de Cartera

Sistema de gestión de cartera crediticia. React + Tailwind + Supabase.

## Inicio rápido

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Estructura

```
src/
  lib/
    supabase.js      # Cliente Supabase
    utils.js         # Funciones utilitarias
    AppContext.jsx    # Estado global
  components/
    Sidebar.jsx
    DataTable.jsx
    Modal.jsx
    Toast.jsx
  pages/
    Login.jsx
    Dashboard.jsx
    Cartera.jsx
    Gestiones.jsx
    OtherPages.jsx   # Alertas, CobrosHoy, Vencidos, Rodamiento, Reportes
  App.jsx
  main.jsx
  index.css
```

## Deploy

```bash
npm run build
# Sube la carpeta dist/ a tu hosting
```
