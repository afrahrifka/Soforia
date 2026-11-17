# Main Bareng · Soforia

[Indonesia](../../README.md) · **English** · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md)

The library uses a four-way D-pad, search, shared favorites saved on the laptop, alphabetical sorting and eight games per page. Character controls inside games still use the analog stick.

A local console for two people: a laptop runs the authoritative server and shared display; two phone browsers become controllers on the same LAN. Gameplay needs no cloud account or internet after the application has been built.

## Run locally

Use Node.js **20.19+**, npm and a laptop browser with WebGL. Linux is the primary launcher platform.

```sh
npm ci
npm run check
npm test
npm run build
./play.sh
```

Open the operator URL printed by the launcher and scan its QR code with both phones. Do not open the laptop's localhost URL on a phone. Both players can choose a game and start from the dashboard. Use `npm start` for the server without the kiosk launcher. See [offline instructions](../../RUN-OFFLINE.md); an older release archive does not automatically contain current source changes.

## Games and controls

Orbit is a cooperative light-collection adventure; Garden shares planting/harvesting tasks; Seirama keeps answers private until reveal; City is a property duel. Glass has 60 authored sequences, six alternating biomes, moving machines, physical obstacles and local music/foley. Carry, roll, lower, raise and jump together. There are no mandatory angle checks or abstract glass breaks. The final checkpoint advances immediately.

Player 1's **♫** controls shared game audio; **M** toggles local laptop mute. For local Glass keyboard testing, press **F2** in an empty dashboard lobby, then **Enter** for tutorial/start; **F3** releases the slots. [Full controls](../18-kaca-keyboard.md).

## Contribute without changing another game

Start with [AGENTS](../../AGENTS.md), [AI routing](../architecture/AI-START.md) and [collaboration](../../collaboration_guide.md). One PR has one scope. Game work stays in `src/games/<id>/`; dashboard work stays in `src/dashboard/`. Host and shared APIs are separate. Each game owns its server, console, controller, HUD, styles, tests, assets and status.

```sh
npm run game:new -- --id comet --title "Comet Together"
npm run change:new -- --scope game:comet --summary "Add Comet Together"
npm test -- --scope game:comet
npm run check
npm run build
npm run check:scope -- --working
```

Manifest discovery registers the module automatically. Never edit a central game list or generated registry. [Adding a game](../architecture/ADD-GAME.md) explains the contract. AI instruction adapters improve discovery but cannot guarantee every tool reads or obeys them; automated checks and owner review enforce inspectable boundaries. GitHub branch protection must still be enabled by the repository owner.

Code and original audio/geometry use [MIT](../../LICENSE); third-party models retain their [documented licenses](../../public/assets/ATTRIBUTION.md). Do not publish live QR codes, session secrets or private answers. Follow the [Code of Conduct](../../CODE_OF_CONDUCT.md). Automated/browser tests do not prove two-phone acceptance, fun, FPS or input-to-photon; see the [roadmap](../09-roadmap.md). Optional [Trakteer support](https://trakteer.id/oskhar) is never required.


## Tailscale mode and TV mirrors

Normal LAN: `npm run start:normal` (alias `npm start`). Optional tailnet mode: `npm run start:tailscale`; stop it with `npm run stop:tailscale`. Open the printed HTTPS `/tv` link on both screens; TVs only mirror the shared session, and the QR uses the Tailscale origin for the two phone controllers. Screens and phones need tailnet access. For TVs without a suitable Tailscale/WebGL browser, use a Tailscale laptop connected by HDMI. The dedicated HTTPS port defaults to 12443; other services are preserved. No reboot autostart is installed.

[Commands, access requirements and limitations (Indonesian)](../24-tailscale-dan-tv.md).
