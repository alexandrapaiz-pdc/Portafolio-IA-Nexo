# Portafolio IA Nexo

Página para presentar y dar seguimiento a los proyectos de IA de Nexo (Grupo PDC): habilitación del stack, KPIs por proyecto, horas manuales liberadas y bitácora de actualizaciones.

- Publicada como artifact privado de Claude: https://claude.ai/artifact/VPQ8uLmDh6hqiQdsdHFfQy
- Los datos (proyectos, componentes del stack, actualizaciones) viven en la base de datos del artifact; solo editores pueden escribir.

## Estructura

- `src/index.html` — la página (HTML/CSS/JS sin dependencias).
- `src/assets/` — logos de Grupo PDC (la tipografía Geist se carga de Google Fonts).
- `build.py` — incrusta los logos como data URIs y genera `dist/index.html`.
- `seed/make_seed.py` — datos iniciales (backlog de Asana + reuniones de Granola, sep 2026); genera los JSON de `seed/`.

## Publicar cambios

```
python3 build.py        # genera dist/index.html
```

Luego se republica `dist/index.html` en la misma URL del artifact.
