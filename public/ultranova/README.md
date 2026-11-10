# Ultranova prototypes

Standalone, animated prototypes for Ultranova (Three.js loaded from a CDN, no build step).
Served by Next.js from `public/`:

- `/ultranova/assistant.html` — the 3D plastic assistant (carved face, light-reactive eyes, wave/hop on tap).
- `/ultranova/onboarding.html` — dark-mode web onboarding in one glass card, 3 steps (Figma 19598:1627): Welcome → Select your Assistant (carousel of 5: Luma, Nova, Orbi, Pupi, Zeta) → What would you like help with (multi-select). "Start Now!" or Skip continues to the home screen.
- `/ultranova/home.html` — the screen you land on after onboarding: glass sidebar with chat history, assistant greeting with suggestions, chat bar. Responsive (sidebar becomes a drawer under 860px). Uses the assistant name saved by onboarding.
- `/ultranova/robot.js` — the shared 3D assistant renderer (one WebGL canvas, one assistant per `[data-robot]` element), used by onboarding and home.

The 5 avatars currently reuse the same assistant; each will get its own design later.
