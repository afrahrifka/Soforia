# Contributing / Berkontribusi

Mulai dari [Panduan Kolaborasi](collaboration_guide.md), [AGENTS.md](AGENTS.md) dan [peta scope](docs/architecture/AI-START.md). README tersedia dalam [beberapa bahasa](README.md).

One PR, one scope. A game change stays in `src/games/<id>/`; dashboard work stays in `src/dashboard/`. Do not edit another game or shared host to add a game. Use `npm run game:new` and manifest discovery. Read the canonical Indonesian guide or attach it to your AI tool; instruction loading is tool-dependent, while CI checks enforce the documented boundaries.
