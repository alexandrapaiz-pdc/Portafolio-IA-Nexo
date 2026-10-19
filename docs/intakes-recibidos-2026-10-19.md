# Guías de intake recibidas · 19 octubre 2026

Se registran las dos devoluciones confirmadas de la guía enviada el 12 de octubre. Se leyó el contenido de ambos Word el 19 de octubre; sus originales y permisos se conservan en SharePoint. No se copian documentos operativos completos al repositorio.

| Proyecto | Entrega | Evidencia Teams |
|---|---|---|
| `gh` · MegaMás Vacaciones | Luis Fernando Chang, 13 octubre. Guardó la guía en GH; Alexandra confirmó recepción. | [Mensaje de entrega](https://teams.microsoft.com/l/message/19%3A08d17620-0c0a-4737-8fa3-9c3284ba9b90_1e677e30-7742-4aa7-be72-b6e33a7287a3%40unq.gbl.spaces/1791926906149) |
| `regulatorio` · MegaMás Regulatorio | Alejandra Alvarez, 14 octubre, chat con Silvia Ramírez. Reportó guía completada y compartió el Word. | [Mensaje de entrega](https://teams.microsoft.com/l/message/19%3A66f3e59cf614455e8e96552e6b116e60%40thread.v2/1792011350231) |

Los enlaces a los Word, fecha de recepción, remitente y resumen están en `projects[].intakes` de `app/src/data/portfolio.json`, visibles en la ficha del proyecto. La bitácora conserva la fecha de entrega; `snapshotAt` indica la fecha de incorporación. `seed/` conserva el histórico inicial, no es la fuente actual de la interfaz.

## Interpretación de los indicadores

- Regulatorio: la guía declara 0% → 90% de automatización; aproximadamente 20 → ≤10 días hasta expediente listo; aproximadamente 10% → ≤3% de errores internos. Los dos primeros se describen como medidos y el tercero como estimado, pero faltan periodo y muestra. Son baselines/metas declarados, no resultados actuales verificados. `current` permanece nulo.
- Vacaciones: 61 casos observados entre 29 septiembre y 8 octubre; aproximadamente 40 aprobaciones reportadas por separado. No se convierten en volumen mensual ni tasa de aprobación. Esfuerzo, espera y metas siguen pendientes. Se conservan los KPIs existentes del proyecto de alertas y se agregan los del workflow recibido con notas de alcance.
- Los documentos cubren solicitudes de vacaciones y registros sanitarios end-to-end. No se amplía automáticamente el alcance de los proyectos de alertas y MVP bloque 2, respectivamente.
- No se incorporan las duraciones en días del VSM regulatorio como minutos de trabajo activo; requieren aclaración. No se calcula ahorro a partir de estimaciones incompletas.
- César, Rodny y Jackeline no se registran como entregados: los chats revisados no contienen confirmación de devolución.
