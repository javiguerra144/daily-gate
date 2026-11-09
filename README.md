# 🏛️ DAILYGATE: El escándalo del sprint

Temporizador de dailies con forma de simulador de crisis política. Ver [docs/definition.md](docs/definition.md).

Flujo: en el inicio se añaden los participantes → al pulsar **Iniciar** se sortean cargos y orden de intervención → sesión → balance.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests del motor
npm run build    # build estática en dist/
```

Atajos durante la sesión: `Espacio` pausa · `→`/`N` siguiente · `A` ausente · `M` música · `F` pantalla completa · `Esc` cerrar alerta.

## Estructura

- `src/engine/` — lógica pura y testeada: fases, motor de escándalos (`DailyEngine`), resumen e historial.
- `src/data/` — contenido: casos, eventos, tramas, cartas de crisis, generador de corruptelas y cargos. Se pueden añadir noticias sin tocar el motor (cada entrada lleva etiquetas de especialidad y gravedad).
- `src/screens/` — configuración, sesión (TV en directo), balance y historial de legislaturas.
- Configuración e historial se guardan en `localStorage`. Los sonidos se sintetizan con Web Audio.
- La música de fondo ([src/music.ts](src/music.ts)) se genera en tiempo real y se intensifica con cada fase; las imágenes de los casos ([src/components/CaseImage.tsx](src/components/CaseImage.tsx)) son ilustraciones SVG procedurales definidas por `scene`, `props` y `accent` en cada caso.

## Despliegue en GitHub Pages

El workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml):

- **En cada push y pull request**: `npm ci`, comprobación de tipos, tests y build.
- **En cada push a `main`** (o lanzándolo a mano desde *Actions*): compila con la ruta base que indica Pages y despliega.

Configuración inicial (una sola vez): en el repositorio de GitHub, **Settings → Pages → Build and deployment → Source: GitHub Actions**.

La app queda publicada en `https://<usuario>.github.io/<repositorio>/`. La configuración y el historial se guardan en el `localStorage` de cada navegador.
