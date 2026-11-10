# Ultranova prototypes

Standalone, animated prototypes for Ultranova (Three.js loaded from a CDN, no build step).
Served by Next.js from `public/`:

- `/ultranova/assistant.html` — the 3D plastic assistant (carved face, light-reactive eyes, wave/hop on tap).
- `/ultranova/onboarding.html` — dark-mode web onboarding in one glass card, 3 steps (Figma 19598:1627): Welcome → Select your Assistant (carousel of 5: Core, Lumen, Mesh, Volt, Pulse) → What would you like help with (multi-select). "Start Now!" or Skip continues to the home screen.
- `/ultranova/home.html` — the screen you land on after onboarding: glass sidebar with chat history, assistant greeting with suggestions, chat bar. Responsive (sidebar becomes a drawer under 860px). Uses the assistant name saved by onboarding.
- `/ultranova/robot.js` — the shared 3D assistant renderer (one WebGL canvas, one assistant per `[data-robot]` element), used by onboarding and home.

The 5 avatars currently reuse the same assistant; each will get its own design later.

## Design system

All Ultranova screens use **Outfit** for everything and share `ultranova.css` (tokens + `un-*` components):
`un-btn`, `un-link`, `un-chip`, `un-pill`, `un-dot`, `un-badge`, `un-card`, `un-icon-btn`, `un-kbd`, `un-menu`, `un-toast`, `un-msg`, `un-typing`, `un-brand`.
Live reference: `/ultranova/design-system.html`. New screens link `ultranova.css` first and only add layout; if a pattern repeats, add it there instead of in the page.
