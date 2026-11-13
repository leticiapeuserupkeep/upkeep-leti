# Ultranova prototypes

Standalone, animated prototypes for Ultranova (Three.js loaded from a CDN, no build step).
Served by Next.js from `public/`:

- `/ultranova/assistant.html` — the 3D plastic assistant (carved face, light-reactive eyes, wave/hop on tap).
- `/ultranova/onboarding.html` — the welcome, one screen that plays as a sequence: **Welcome to Ultranova** (black → olive), fading in; then, written word by word and kept on screen, "Your personal assistant, quietly working in the background and reaching out when you’re needed." (one line on wider screens) and "Let's get started with some tasks..."; then the four tasks one under another (135ms apart, a glint runs around the border on hover) and the message box ("Or tell me what you have in mind…"). Picking an option or sending a message slides the welcome left and opens home. Light by default (warm off-white with two soft olive glows, `.un-glow`), dark behind the toggle.
- `/ultranova/home.html` — the workspace: sidebar, chat, message box. Arriving from the welcome it slides in, the request is the user's first message, and the assistant introduces itself in the middle of the chat ("Hi Leti, I'm Lumen. I'll be your assistant in Ultranova." · Change assistant, inline · Settings later) and carries on with the task right away, no extra click. Each task is set up as a short conversation (e.g. briefing: time → calendar or not), then the assistant shows the steps it works through and a result card to approve. The empty chat (a later visit) shows the assistant, "Hi Leti, I'm Lumen" (hover the assistant to change it) and the four tasks. Light follows the Figma "new ui" section (Nova file, page ⚡️ Ultranova): warm off-white page (#f7f7f5) with three white cards — sidebar (dark "+ New" menu, the conversation in progress in soft grey), chat (grey message box) and a right panel (Progress dots that move as the task is set up → worked on → done, Outputs, Context); olive → yellow accent. Dark mode is unchanged and switched on the welcome screen (shared via `localStorage['ultranova.theme']`). Figma assets live in `assets/` (logo mark, CMS icon, avatar).
- `/ultranova/wow.js` — the four tasks (`UltranovaWow`): option (welcome question), title (user's request), intro, setup questions, steps, answer, result card, follow-ups. Connections depend on the task: calendar only for meetings, Slack/Teams only if the user wants alerts there; work orders and inspections need nothing but UpKeep data.
- `/ultranova/robot.js` — the shared 3D assistant renderer (one WebGL canvas, one assistant per `[data-robot]` element), used by onboarding and home.

The 5 avatars currently reuse the same assistant; each will get its own design later.

## Design system

All Ultranova screens use **Outfit** for everything and share `ultranova.css` (tokens + `un-*` components):
`un-btn`, `un-link`, `un-chip`, `un-pill`, `un-dot`, `un-badge`, `un-card`, `un-icon-btn`, `un-kbd`, `un-menu`, `un-toast`, `un-msg`, `un-typing`, `un-brand`, `un-wow` (starter card), `un-trace` (working steps), `un-res` (result card), `un-btn--primary` (black on light, white on dark).
Live reference: `/ultranova/design-system.html`. New screens link `ultranova.css` first and only add layout; if a pattern repeats, add it there instead of in the page.

## Conversation cards (reference for developers)

Every card the assistant shows in the chat is the same component, `.un-res` (head · body · actions), documented in `cards.js` with its building blocks in `ultranova.css`:

- `.un-rows`: a list of records (work orders, PMs…), title + meta on the left, `.un-prio` and `.un-status` pills on the right.
- `.un-vtl`: a vertical timeline (date · dot by severity · what happened).
- `.un-res__inset` (summary, `.un-bar`, `.un-res__kv`) and `.un-res__list` (findings with a colored dot).

Ask the chat for "my open work orders", "the preventive maintenance due" or "what happened with Chiller #2" to get each card, or open `home.html?demo=cards` to see the three in one conversation.

## Dark mode

Dark mirrors the light new UI: same layout and components in warm dark greys, no background image, just the two soft purple glows (`.un-glow`). Each light rule (`:root[data-theme="light"] …`) has a dark twin right after it, between `/*dk*/` and `/*/dk*/`, generated with a fixed color map (white → `#1c1c1b`, `#f7f7f5` → `#252523`, `#1a1a1a` → `#f2f2ee`…). After changing light styles, regenerate the twins from the repo root:

    python3 scripts/ultranova-gen-dark.py
