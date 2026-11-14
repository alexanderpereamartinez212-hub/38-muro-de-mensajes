<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# Reglas del proyecto: Muro de mensajes con moderación

## Stack
Next.js 16 (App Router), React, TypeScript, Firebase Auth + Firestore (solo con Admin SDK desde la API), Zod, Vitest, Vercel.

## Comandos
- `npm run dev`: servidor de desarrollo
- `npm run lint`: ESLint
- `npm run typecheck`: revisión de tipos
- `npm test`: pruebas (Vitest)
- `npm run check`: lint + tipos + pruebas

## Estructura
- `app/`: rutas y Route Handlers (`app/api/**`)
- `src/components`, `src/hooks`, `src/schemas`, `src/services`, `src/repositories`, `src/lib`
- Capas de la API: Route Handler → servicio → repositorio. Solo los repositorios tocan Firestore.

## Lo que SÍ
- Componentes de servidor por defecto; `"use client"` solo si hay estado o eventos.
- Validar con Zod (modo estricto) en cliente y servidor.
- El `uid` sale siempre de la sesión verificada.
- HTML semántico y accesible (WCAG 2.2 AA).

## Lo que NO
- No leer ni mostrar `.env*`, claves ni credenciales.
- No salir de la carpeta del proyecto.
- No usar `dangerouslySetInnerHTML` sin sanear.
- No importar `firebase/firestore` en el navegador.
- No usar `<div onClick>`: usar `<button>` o `<a>`.
- No hacer `git push`, desplegar ni instalar paquetes sin pedir permiso.