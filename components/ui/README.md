# components/ui

Este proyecto hoy es un solo archivo HTML (`src/index.html`) publicado como artifact de Claude, sin React, Tailwind ni TypeScript.

- **Aurora (intro de bienvenida):** el componente `leonardo-primo-background-animato-1.tsx` de 21st.dev (Shader Builder "Aurora") está portado a JavaScript puro dentro de `src/index.html` (bloque `Intro`), con la paleta de Grupo PDC. El shader es WebGL sin dependencias, así que no requiere React.

Cuando el portal migre a un stack React (por ejemplo en la plataforma de Nexo en Azure):

```bash
npx shadcn@latest init        # Next.js o Vite + Tailwind + TypeScript
```

`components/ui` es la ruta por defecto de shadcn: ahí viven los componentes de UI reutilizables y es donde el CLI agrega los nuevos. Copia el componente original de 21st.dev a `components/ui/leonardo-primo-background-animato-1.tsx` y úsalo así:

```tsx
<div className="relative h-screen w-full overflow-hidden">
  <ShaderBackground className="absolute inset-0" />
</div>
```
