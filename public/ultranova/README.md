# Ultranova prototypes

Standalone, animated prototypes for Ultranova (Three.js loaded from a CDN, no build step).
Served by Next.js from `public/`:

- `/ultranova/assistant.html` — the 3D plastic assistant (carved face, light-reactive eyes, wave/hop on tap).
- `/ultranova/onboarding.html` — the welcome, one screen that plays as a sequence: **Welcome to Ultranova** (pink → purple), "Your personal assistant, here to help while you work and keep things moving while you rest.", which gives way to "Let's get started. Want me to…" and the four options one under another, then the message box ("Or have something else in mind?"). Each piece fades in with a 10px rise over 350ms, options 135ms apart. Picking an option or sending a message slides the welcome left and opens home. Light by default (soft lilac glow at 30%, drifting), dark behind the toggle.
- `/ultranova/home.html` — the workspace: sidebar, chat, message box. Arriving from the welcome it slides in, the request is the user's first message, and the assistant introduces itself in the middle of the chat ("Hi Leti, I'm Core. I'll be your assistant in Ultranova." · Change assistant, inline · Settings later) and carries on with the task right away, no extra click. Each task is set up as a short conversation (e.g. briefing: time → calendar or not), then the assistant shows the steps it works through and a result card to approve. The empty chat (a later visit) offers the four tasks as cards. Light by default, dark toggle in the sidebar footer (shared with the welcome via `localStorage['ultranova.theme']`).
- `/ultranova/wow.js` — the four tasks (`UltranovaWow`): option (welcome question), title (user's request), intro, setup questions, steps, answer, result card, follow-ups. Connections depend on the task: calendar only for meetings, Slack/Teams only if the user wants alerts there; work orders and inspections need nothing but UpKeep data.
- `/ultranova/robot.js` — the shared 3D assistant renderer (one WebGL canvas, one assistant per `[data-robot]` element), used by onboarding and home.

The 5 avatars currently reuse the same assistant; each will get its own design later.

## Design system

All Ultranova screens use **Outfit** for everything and share `ultranova.css` (tokens + `un-*` components):
`un-btn`, `un-link`, `un-chip`, `un-pill`, `un-dot`, `un-badge`, `un-card`, `un-icon-btn`, `un-kbd`, `un-menu`, `un-toast`, `un-msg`, `un-typing`, `un-brand`, `un-wow` (starter card), `un-trace` (working steps), `un-res` (result card), `un-btn--primary` (black on light, white on dark).
Live reference: `/ultranova/design-system.html`. New screens link `ultranova.css` first and only add layout; if a pattern repeats, add it there instead of in the page.
