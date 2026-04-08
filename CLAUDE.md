# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Keep your replies extremely concise and focus on conveying the key information. No unnecessary fluff, no long code snippets. 

## Caveman
Use short, 3-6 word sentences.
- No filler, preamble, or pleasantries.
- Run tools first, show the result, then stop. Do not narrate.
- Drop articles (Me fix code" not "I will fix the code").

## Overview

A static single-page PWA (Progressive Web App) chmod calculator with no build step, no dependencies, and no package manager. Open `index.html` directly in a browser to run locally.

## Architecture

The app is entirely vanilla HTML/CSS/JS across three files:

- **`index.html`** — All markup. The permissions grid uses `data-col` (0=Owner, 1=Group, 2=Public) and `data-val` (4=Read, 2=Write, 1=Execute) attributes on checkboxes to encode permission bits.
- **`app.js`** — All logic. Two-way sync between checkboxes and the octal text input. `update()` computes octal/symbolic from checkbox state; `validateAndSync()` does the reverse. State is persisted to `localStorage` under key `"chmod-state"`.
- **`style.css`** — All styles. Uses CSS custom properties for theming (colors, spacing).

**PWA:** `sw.js` registers a service worker that serves cached assets when offline. `manifest.json` defines the installable app metadata.

**CSP:** `index.html` enforces a strict Content-Security-Policy via meta tag — no inline scripts/styles allowed. Fonts load from `fonts.googleapis.com` / `fonts.gstatic.com`.

## Key logic flows

- **Checkbox → octal:** `update()` sums `data-val` per `data-col`, joins into 3-digit string, updates `#octal-input` and `#symbolic`.
- **Octal → checkbox:** `validateAndSync()` reads `#octal-input`, validates `/^[0-7]{3}$/`, then sets each checkbox via bitwise AND of the digit and the checkbox's `data-val`.
- **State persistence:** `saveState()` / `loadState()` serialize checkbox checked states as a boolean array in localStorage.
