# Correo de intake para nuevas solicitudes

Cada solicitud nueva en la API de Azure registra un correo pendiente en la misma transacción que el ticket. El destinatario proviene de la sesión de Entra, nunca de un campo enviado por el navegador. El correo incluye el código del ticket, la guía editable de Word y las instrucciones para responder con el documento y la carpeta de SharePoint. Las actualizaciones e importaciones no generan correos.

## Activación

El envío queda desactivado hasta configurar el buzón y autorizar la identidad administrada. Las solicitudes nuevas quedan en cola mientras tanto. No se cambia la rutina del artifact de Claude.

1. Un administrador de Exchange debe autorizar a la identidad de la app para enviar exclusivamente desde `alexandra.paiz@grupopdc.com`. Usar **Exchange Online RBAC for Applications**, rol `Application Mail.Send` con un alcance que incluya solo ese buzón. No hace falta acceso de lectura al correo ni permiso para enviar desde todos los buzones.
2. Verificar el alcance con `Test-ServicePrincipalAuthorization` para el buzón autorizado y para otro buzón que deba quedar excluido. Referencia: [Microsoft Exchange RBAC for Applications](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac).
3. Configurar en el contenedor `NEXO_CORREO_REMITENTE=alexandra.paiz@grupopdc.com` y `NEXO_CORREO_ACTIVO=1`. Se usa la identidad indicada por `AZURE_CLIENT_ID`, ya utilizada para PostgreSQL. Mantener al menos una réplica activa para procesar correos aunque no entren peticiones.
4. Enviar una solicitud de prueba propia y comprobar la recepción y el adjunto antes de anunciar que el envío está activo. `202 Accepted` significa que Graph aceptó el mensaje, no que llegó al buzón. Referencia: [Graph sendMail](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0).

Ejemplo para el administrador de Exchange, después de conectar con `Connect-ExchangeOnline` y sustituir los identificadores por los de la identidad administrada del contenedor:

```powershell
New-ServicePrincipal -AppId '<client-id>' -ObjectId '<principal-id>' -DisplayName 'Nexo Portafolio IA'
New-ManagementScope -Name 'NexoIntakeAlexandra' -RecipientRestrictionFilter "PrimarySmtpAddress -eq 'alexandra.paiz@grupopdc.com'"
New-ManagementRoleAssignment -Name 'NexoIntakeMailSend' -Role 'Application Mail.Send' -App '<principal-id>' -CustomResourceScope 'NexoIntakeAlexandra'
Test-ServicePrincipalAuthorization -Identity '<principal-id>' -Resource 'alexandra.paiz@grupopdc.com'
```

Si el service principal o el alcance ya existen, reutilizarlos después de verificar su configuración. Los permisos de aplicación concedidos en Entra son acumulativos con RBAC; no agregar una concesión global de Mail.Send que anule el alcance restringido.

## Operación

- El procesador consulta la cola cada 10 segundos. Los fallos se reintentan hasta cinco veces con espera creciente. Un fallo de Graph no impide guardar la solicitud.
- `GET /api/solicitudes/correos`: estado de las últimas 100 entregas, solo editores.
- `POST /api/solicitudes/correos/{id}/reintentar`: reactiva una entrega fallida, solo editores. No reenvía entregas aceptadas.
- `GET /api/solicitudes/formulario`: descarga del Word, con sesión. También está enlazada en el formulario de nueva solicitud.
- Estados: `pendiente`, `aceptado` por Graph y `fallido`. Los logs incluyen el ID y un código de error, sin tokens ni cuerpo del mensaje. Supervisar los fallidos y los pendientes antiguos.
- Varias réplicas coordinan por bloqueo de fila. Graph no admite clave de idempotencia para sendMail: una interrupción entre la aceptación y su registro puede causar un duplicado al reintentar. El código de solicitud permite reconocerlo.
- Para pausar el envío, quitar `NEXO_CORREO_ACTIVO` o ponerlo en `0`; los pendientes se conservan.

## Actualizar el formulario

La fuente está en `docs/guia-workflow-ia.md`. `scripts/generar_guia.py` genera `api/app/recursos/guia-workflow-ia.docx` con python-docx y Pillow. El Dockerfile copia ese directorio junto con la API. Después de regenerar, revisar todas las páginas renderizadas antes de subir el binario. El PDF compartido es una versión de consulta; el Word permite editar texto y agregar filas.

## Pruebas

`python -m pytest -q tests` desde `api/`, con PostgreSQL de prueba y las variables PG*. Todas las entregas se simulan; la suite nunca envía correo real. Cubre identidad del destinatario, guardado atómico, ausencia de duplicados por edición, importaciones, reintentos, concurrencia y adjunto. El envío real requiere el permiso anterior y la prueba de recepción.
