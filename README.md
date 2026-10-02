# Portafolio IA Nexo

Portafolio de IA de Nexo (Grupo PDC): stack de IA, AI Best Practices, Company Brain, proyectos de agentes, tareas de Asana, solicitudes y portal de agentes.

- **En vivo:** https://claude.ai/artifact/VPQ8uLmDh6hqiQdsdHFfQy (artifact de Claude con base de datos; solo editores escriben).
- **Correo de solicitudes:** rutina programada "Correo de solicitudes IA Nexo" (L–V, cada hora 7:53–17:53 Guatemala).

## App (`app/`)

Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (estructura en `components.json`, componentes en `src/components/ui`).

```bash
cd app
npm install
npm run dev      # desarrollo local (sin datos: la página muestra estados vacíos)
npm run build    # dist/index.html (sitio estático de un solo archivo) y dist/artifact.html (para publicar como artifact)
```

| Carpeta | Contenido |
|---|---|
| `src/components/ui` | shadcn/ui (Button, Dialog, Input, Label, Badge) y `leonardo-primo-background-animato-1.tsx` (shader Aurora de 21st.dev con paleta PDC) |
| `src/components` | Navegación, intro, ficha de proyecto, diagrama del stack, mapas de flujo de valor, esfera del portal |
| `src/views` | Inicio, Portafolio, Tareas, Agentes, Solicitudes |
| `src/lib` | Store (capacidades `db`, `user`, `mcp` del artifact), router por hash, dominio y formatos |

`npx shadcn add <componente>` funciona donde ui.shadcn.com sea accesible; en este entorno los componentes se escribieron a mano con el mismo patrón (Radix + CVA + `cn`).

**Despliegue temporal (Vercel):** `vercel.json` en la raíz ya define instalación, build y salida (`app/dist`). En Vercel: *Add New → Project*, importar este repositorio, dejar *Root Directory* en la raíz y desplegar; o desde la terminal, `npx vercel` en la raíz. Fuera de claude.ai no existe la base de datos del artifact, así que el sitio muestra la interfaz con estados vacíos (la demo de Agentes sí se ve completa). Activar *Settings → Deployment Protection → Vercel Authentication* para que solo entren cuentas del equipo.

**Despliegue futuro (Azure):** `dist/index.html` es un sitio estático. La capa de datos vive en `src/lib/store.tsx`; para Azure se reemplaza por la API de la plataforma de Nexo sin tocar las vistas.

## Datos

`seed/` guarda los datos iniciales y las actualizaciones aplicadas a la base de datos del artifact (proyectos, componentes, bitácora, Asana, mapas de valor).

`legacy/` conserva la versión anterior en un solo archivo HTML.
