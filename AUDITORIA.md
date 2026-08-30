# AUDITORÍA — Ecosistema Duck
Fecha: 2026-08-30 · Cuenta GitHub: `belentani7` · Herramientas: gh CLI, git, grep

## 1. Inventario de repos Duck (12)

| Repo | Rol | Stack | Estado |
|---|---|---|---|
| `Duck-Omega` | **Hub de producción** (catálogo de todas las apps: Omega-79, ZION-33, Nova-7, Odin-2, Rex-20, iDuck, Sim-22, Alpha-77, FL, Studio) | Astro 5 + Vite + Express + tRPC + Drizzle + MySQL | **REPARADO Y VERIFICADO** (build OK, servidor 200) |
| `duck-apps` | Suite de apps musicales estáticas | HTML/JS/CSS (Web Audio) | OK — iDuck, Station, FL, GEMA, Magic, Sequencer |
| `DuckHTML` | Hub/catálogo estático (fuente de `Duck-html.zip`) | HTML estático | OK |
| `Duck-Deck` | Documentación | Markdown | OK (solo docs, sin código) |
| `DUCK-STUDIO-LOCAL-WIN11` | Duck Studio OS local Win11 (docs + HTML offline + prompt mestre) | Docs + HTML | OK |
| `duck-producao-musical` | App full-stack produção musical | Vite + Express | Sin verificar (iteración anterior) |
| `omega-max-duck` | App full-stack | Vite + Express | Sin verificar (iteración) |
| `duck-zion-apex-public` | App full-stack | Vite + Express | Sin verificar (iteración) |
| `duck-lucas-artista` | App artista Lucas | Vite + React + Express | Sin verificar |
| `duck-zion-studio` | Monorepo Zion | apps/studio-os, packages, tools | OK |
| `DUCK-ZION-GITHUB` | Monorepo Zion (espejo GitHub) | apps, packages, tools | OK |
| `duck-studio-os-protected` | Delivery Duck Studio OS | Docs + apps | OK |

Repos de referencia relacionadas (no incluidas, mismas fechas): `Pedro-Belentani-2026`, `Pedro-Belentani-Studio`, `Pedro-Belentani`.

## 2. Escaneo de secretos

Patrones buscados en TODO el paquete (`repos/` + `local/`):
- Tokens GitHub (`ghp_`, `github_pat_`), OpenAI (`sk-`), AWS (`AKIA`), Slack (`xox`), Google (`AIza`)
- Claves privadas PEM (`BEGIN ... PRIVATE KEY`)
- Supabase/DashScope/API keys hardcodeadas, passwords inline, Bearer tokens

**Resultado: SIN credenciales reales.**

Hallazgos menores (sin riesgo):
- `duck-zion-studio/.../research/fiverr-automation-research.md`: cadenas `FB_EMAIL` / `FB_PASSWORD` — son **placeholders** citados de la documentación de un paquete npm, no credenciales.
- `.env.example` / `env.example` en varias apps: solo plantillas vacías (comportamiento correcto).

Recomendaciones:
1. Nunca commitear `.env` reales (todas las apps ya tienen `.env.example`).
2. Si alguna vez se usó una credencial real en estas repos y luego se borró, igualmente rotarla (queda en el historial git; este clonado es `--depth 1` pero GitHub conserva el historial completo).

## 3. Reparaciones aplicadas (Duck-Omega)

1. Scripts npm incompatibles con Windows: `NODE_ENV=production node ...` → `cross-env NODE_ENV=production node ...` (igual en `dev`). Añadido `cross-env` a devDependencies.
2. pnpm bloqueaba los build scripts nativos → añadido `pnpm.onlyBuiltDependencies: ["@tailwindcss/oxide","esbuild"]`.
3. Verificación real ejecutada el 2026-08-30:
   - `pnpm install`: OK (2428 paquetes)
   - `pnpm build`: OK (4 páginas, `dist/index.js` 83.8 kB)
   - Servidor en producción: `GET /` → **200 OK** en `http://localhost:3000`

## 4. Notas de arquitectura (de `ecosystem.config.json`)

- Apps activas: `duck-apps`, `DuckHTML`, `Duck-Omega`, `duck-zion-apex-public`; privado: `Duck-Deck`.
- Dominio: `www.duck.com.br` · Email: `pedro@duck.com.br`
- El zip `Duck-html.zip` (111 MB, `C:\Users\USER\Desktop`) se regenera desde `DuckHTML`.

## 5. Recomendaciones siguientes

1. Tratar `Duck-Omega` como el hub canónico; las iteraciones (`duck-producao-musical`, `omega-max-duck`, `duck-zion-apex-public`) son candidatas a consolidar/retirar.
2. Configurar `.env` real solo localmente (MySQL para Drizzle) si se necesita persistencia.
3. Usar `automation/sync-duck-repos.ps1` para respaldar cambios y el workflow `deploy-duckhtml.yml` para publicar el hub estático en GitHub Pages.
