# Publicación y conexiones · Portafolio IA Nexo

Responsable: Alexandra Paiz. Audiencia: company (acceso corporativo mediante Entra). Mundo: Nexo. Área: Planeación y Gestión. Suplente operativo pendiente.

El 12 de octubre de 2026 Alexandra confirmó expresamente conservar público este repositorio y no bloquear la publicación por su visibilidad. No volver a solicitar ese cambio. La excepción no elimina Entra ni autoriza ampliar permisos de la aplicación.

## Despliegue

- URL: https://nexo-portafolio-ia.wittysea-7e111699.eastus.azurecontainerapps.io
- Recurso existente: `rg-nexo-ai-core/nexo-portafolio-ia`, revisión Single, registro `crnexoaipdc01`.
- GitHub Actions: `.github/workflows/desplegar.yml`, entorno `produccion`, push a `main`, PR con pruebas y ejecución manual.
- GitHub OIDC usa las variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`; identidad de despliegue separada de la identidad administrada de runtime.
- Build reproducible: `npm ci --prefix app && npm run build:nexo --prefix app`; Dockerfile construye interfaz y API. Backend probado contra PostgreSQL efímero en CI.
- Imagen inmutable por digest; comprobante `deployment.json` del workflow contiene commit, digest anterior, revisión y fecha. La revisión debe estar Healthy/Running y coincidir con latestRevisionName y latestReadyRevisionName.
- Recuperación: volver al digest anterior del comprobante y verificar salud y protección. El rollback de código no revierte datos.
- Borrador Nexo: `866ad3b7-1069-4243-971f-20443a24bf48`. Fase elegida: production; versión sin asignar. La sincronización del catálogo ocurre después de verificar el sitio.

## Inventario

| Conexión | Código y flujo | Autorización / configuración | Estado y recuperación |
|---|---|---|---|
| Entra | Easy Auth → `api/app/identidad.py` → API | Sesión corporativa; `NEXO_EDITORES` define edición. Sin credenciales en frontend. | Configuración existente preservada. Verificar login y rechazo anónimo en cada publicación. |
| PostgreSQL | `conexion.py`, `almacen.py`, `colecciones.py`; solicitudes, historial y cola | Identidad administrada y TLS; `PGHOST`, `PGDATABASE`, `PGUSER`, `PGSSLMODE`, `DB_SCHEMA`, `NEXO_PG_ENTRA`, `AZURE_CLIENT_ID` | Persistencia existente. Migraciones al inicio es una limitación heredada; separación DDL/DML y ensayo de restauración pendientes de evidencia. |
| Portafolio | `app/src/data/portfolio.json` → store → vistas | Snapshot de la rama Claude, actualizado mediante PR/build; no consulta Asana en vivo | Lectura estática. Solicitudes/triage siguen usando API y PostgreSQL. |
| Microsoft Graph correo | `api/app/correos.py`, cola transaccional → Graph | `NEXO_CORREO_ACTIVO`, `NEXO_CORREO_REMITENTE`; Mail.Send limitado a buzón requiere autorización específica | Desactivado. No se envían correos en estas pruebas. Word descargable con sesión; recuperación y reintentos en `correos-intake.md`. |
| Asana | Adaptador legado `POST /api/asana/tarea` | `ASANA_TOKEN` de integración, sin reutilizar tokens personales/MCP | No configurado; las nuevas pantallas no lo consumen. No afirmar sincronización viva. |
| SharePoint | Enlace de guía desde Solicitudes | Permisos propios del documento; no token Graph heredado | Enlace, no sincronización ni importación. El Word local está disponible con sesión. |
| Nexo Apps | WebMCP desde sesión corporativa; registro de URL y borrador | Propietario del borrador y ACL existentes | Registro no despliega ni concede acceso a Azure. |

No almacenar secretos, tokens ni contenido de solicitudes en este inventario. La identidad corporativa de GitHub tiene acceso efectivo al repositorio; la cuenta personal tiene solo lectura actualmente. IT coordina Entra, proveedor de correo y recuperación de datos. El historial de GitHub Actions proporciona la evidencia de pruebas/despliegue por SHA.
