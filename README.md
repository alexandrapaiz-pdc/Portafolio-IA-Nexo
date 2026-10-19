# Portafolio IA Nexo

Portafolio de IA de Nexo (Grupo PDC): stack de IA, AI Best Practices, Company Brain, proyectos de agentes, solicitudes y portal de agentes.

- **En vivo:** https://claude.ai/artifact/VPQ8uLmDh6hqiQdsdHFfQy (artifact de Claude con base de datos; solo editores escriben).
- **Azure:** https://nexo-portafolio-ia.wittysea-7e111699.eastus.azurecontainerapps.io — Entra, API propia y PostgreSQL.
- **Publicación y conexiones:** [docs/conexiones.md](docs/conexiones.md). El repositorio permanece público por instrucción expresa de Alexandra; esto no cambia el acceso corporativo de la app.
- **Correo de solicitudes:** rutina programada "Correo de solicitudes IA Nexo" (L–V, cada hora 7:53–17:53 Guatemala).

## App (`app/`)

Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (estructura en `components.json`, componentes en `src/components/ui`).

```bash
cd app
npm ci
npm run dev      # desarrollo local (portafolio estático; solicitudes requieren backend)
npm run build    # dist/index.html (sitio estático de un solo archivo) y dist/artifact.html (para publicar como artifact)
```

| Carpeta | Contenido |
|---|---|
| `src/components/ui` | shadcn/ui (Button, Dialog, Input, Label, Badge) y `leonardo-primo-background-animato-1.tsx` (shader Aurora de 21st.dev con paleta PDC) |
| `src/components` | Navegación, intro, ficha de proyecto, diagrama del stack, mapas de flujo de valor, esfera del portal |
| `src/views` | Inicio, Portafolio, Solicitudes |
| `src/lib` | Store (capacidades `db`, `user`, `mcp` del artifact), router por hash, dominio y formatos |

`npx shadcn add <componente>` funciona donde ui.shadcn.com sea accesible; en este entorno los componentes se escribieron a mano con el mismo patrón (Radix + CVA + `cn`).

**Despliegue temporal (Vercel):** `vercel.json` en la raíz ya define instalación, build y salida (`app/dist`). En Vercel: *Add New → Project*, importar este repositorio, dejar *Root Directory* en la raíz y desplegar; o desde la terminal, `npx vercel` en la raíz. Fuera de claude.ai no existe la base de datos del artifact, así que el sitio muestra la interfaz con estados vacíos (la demo de Agentes sí se ve completa). Activar *Settings → Deployment Protection → Vercel Authentication* para que solo entren cuentas del equipo.

## Versión Azure (`api/` + `Dockerfile`)

Primer caso real del estándar de Nexo para apps con datos: la página y su API en **un solo contenedor** de Azure Container Apps, con inicio de sesión de Entra y datos en el PostgreSQL de Nexo (esquema propio `app_portafolio_ia`, sin contraseñas: la app entra con su identidad administrada).

| Pieza | Qué hace |
|---|---|
| `app/src/lib/nexo-runtime.ts` | La misma forma que `window.claude` (`db`, `user`, `mcp`) pero contra `/api`. `npm run build:nexo` compila la página con este runtime; `npm run build` sigue generando el artifact igual que antes |
| `api/app/main.py` | FastAPI: entrega la página y la API de datos (colecciones, documentos, personas, importación, correo de intake) |
| `api/app/colecciones.py` | Cómo se guarda cada colección. `projects`, `components`, `updates`, `asana`, `asanaMeta` y `triage` como **documentos**; `tickets` (solicitudes) como **tabla con columnas** (`solicitudes`), validada y lista para reportes |
| `api/app/correos.py` | Correo al solicitante con la guía de intake, por Microsoft Graph con la identidad de la app |
| `api/migraciones/005_metricas_fde.sql` | Métricas trimestrales de despliegue (colección `metricas`, tabla `metricas_fde`): una fila por trimestre, solo editores escriben, validación y historial |
| `api/app/almacen.py` | Documentos y tablas con las mismas reglas: versión por fila, historial de cada cambio, borrado lógico y número de cambio para que la página se actualice sola |
| `api/migraciones/` | SQL versionado que la app aplica al arrancar |
| `api/tests/` | Pruebas contra un PostgreSQL real |

Reglas: leer exige sesión de Entra; cualquier persona de PDC envía solicitudes (quién y cuándo los pone el servidor); solo los editores (`NEXO_EDITORES`) cambian el portafolio, evalúan o borran.

Correo de intake: cola durable y adjunto Word. El envío permanece desactivado hasta configurar y autorizar el buzón; ver [docs/correos-intake.md](docs/correos-intake.md). No se promete entrega de correo al crear una solicitud.

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

## Cómo se publica

1. **Automático:** cada push a `main` lo prueba, construye y publica `.github/workflows/desplegar.yml` (GitHub Actions con OIDC, sin contraseñas guardadas).
2. **A pedido, directo:** `scripts/desplegar.sh` hace lo mismo sin GitHub Actions (imagen construida en Azure con `az acr build`, solo cambia la imagen, espera revisión sana y verifica que Entra y la configuración protegida no cambiaron). Requiere un service principal limitado a esta app y al registro, en variables del entorno (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_SUBSCRIPTION_ID`), y acceso de red a Azure. Solo despliega lo que ya está en `origin/main`.

## Datos

`seed/` guarda los datos iniciales y las actualizaciones aplicadas a la base de datos del artifact (proyectos, componentes, bitácora, Asana, mapas de valor).

`legacy/` conserva la versión anterior en un solo archivo HTML.

## Guía de intake por correo

La API de Azure encola el formulario Word al crear una solicitud. La activación del buzón, los reintentos y las pruebas están en [docs/correos-intake.md](docs/correos-intake.md). El envío está desactivado hasta autorizar y configurar el buzón; la descarga del formulario funciona con sesión.
