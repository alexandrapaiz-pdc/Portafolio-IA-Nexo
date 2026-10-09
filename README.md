# Portafolio IA Nexo

Portafolio de IA de Nexo (Grupo PDC): stack de IA, AI Best Practices, Company Brain, proyectos de agentes, tareas de Asana, solicitudes y portal de agentes.

- **En vivo:** https://claude.ai/artifact/VPQ8uLmDh6hqiQdsdHFfQy (artifact de Claude con base de datos; solo editores escriben).
- **En Azure (en preparación):** contenedor `nexo-portafolio-ia` con API propia y PostgreSQL. Ver *Versión Azure*.
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

## Versión Azure (`api/` + `Dockerfile`)

Primer caso real del estándar de Nexo para apps con datos: la página y su API en **un solo contenedor** de Azure Container Apps, con inicio de sesión de Entra y datos en el PostgreSQL de Nexo (esquema propio `app_portafolio_ia`, sin contraseñas: la app entra con su identidad administrada).

| Pieza | Qué hace |
|---|---|
| `app/src/lib/nexo-runtime.ts` | La misma forma que `window.claude` (`db`, `user`, `mcp`) pero contra `/api`. `npm run build:nexo` compila la página con este runtime; `npm run build` sigue generando el artifact igual que antes |
| `api/app/main.py` | FastAPI: entrega la página y la API de datos (colecciones, documentos, personas, importación, lectura de Asana) |
| `api/app/colecciones.py` | Cómo se guarda cada colección. `projects`, `components`, `updates`, `asana`, `asanaMeta` y `triage` como **documentos**; `tickets` (solicitudes) como **tabla con columnas** (`solicitudes`), validada y lista para reportes |
| `api/app/almacen.py` | Documentos y tablas con las mismas reglas: versión por fila, historial de cada cambio, borrado lógico y número de cambio para que la página se actualice sola |
| `api/migraciones/` | SQL versionado que la app aplica al arrancar |
| `api/tests/` | Pruebas contra un PostgreSQL real |

Reglas: leer exige sesión de Entra; cualquier persona de PDC envía solicitudes (quién y cuándo los pone el servidor); solo los editores (`NEXO_EDITORES`) cambian el portafolio, evalúan o borran. La sincronización con Asana la hace el servidor con un token guardado en Key Vault, solo lectura.

```bash
# Pruebas (PostgreSQL local)
cd api && pip install -r requirements-dev.txt
PGHOST=localhost PGUSER=postgres PGDATABASE=apps python -m pytest -q tests

# Correr local: compila la página en modo Azure y levanta la API con un usuario de prueba
cd app && npm ci && npm run build:nexo && cd ../api
PGHOST=localhost PGUSER=postgres PGDATABASE=apps DEV_USUARIO="tu@correo|Tu nombre" NEXO_EDITORES="tu@correo" \
  uvicorn app.main:app --reload    # http://localhost:8000
```

Los datos iniciales se cargan una vez en `/importar` (solo editores) con la exportación de la base de datos del artifact. Los pasos de despliegue con los nombres reales de Azure están en la guía privada de BestPracticesAI.

## Datos

`seed/` guarda los datos iniciales y las actualizaciones aplicadas a la base de datos del artifact (proyectos, componentes, bitácora, Asana, mapas de valor).

`legacy/` conserva la versión anterior en un solo archivo HTML.

## Guía de intake por correo

La API de Azure encola el formulario Word al crear una solicitud. La activación del buzón, los reintentos y las pruebas están en [docs/correos-intake.md](docs/correos-intake.md). El envío está desactivado hasta autorizar y configurar el buzón; la descarga del formulario funciona con sesión.
