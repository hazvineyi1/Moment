---
name: Obsidian design system
description: Dark luxury visual language applied to A-Moment app; palette, type, and component conventions.
---

## Palette (all CSS variables in index.css)
- `--background: 0 0% 10%` → `#1a1a1a` dark charcoal (not pure black)
- `--foreground: 38 25% 97%` → near-white warm cream
- `--card: 0 0% 14%` → `#242424`
- `--primary: 38 50% 61%` → `#c9a96e` champagne gold
- `--muted-foreground: 34 18% 62%` → `#a89880` warm grey (was `#8a7a65` — too low contrast on near-black)
- `--border: 38 20% 22%` → warm dark gold border
- `--radius: 2px` → nearly square corners everywhere

## Typography
- Headlines: Playfair Display **italic** (not bold), via `font-serif italic`
- Body: Outfit weight 300 (`font-light`)
- Labels: `uppercase text-[11px] tracking-[0.2em]` in Outfit — minimum 11px; never use text-[9px] or text-[10px]
- Body weight: 400 (normal) — never use `font-light` (forces 300, makes text thin and hard to read)

## Key utility conventions
- Gold hairline border: `style={{ border: '1px solid rgba(201,169,110,0.15)' }}`
- Gold border strong: `rgba(201,169,110,0.3)` — for selected/active states
- Card surface: `style={{ background: '#141414', border: '1px solid rgba(201,169,110,0.12)' }}`
- At-a-glance panel: `border: '1px solid rgba(201,169,110,0.12)', background: 'rgba(201,169,110,0.02)'`
- Selection: gold border 0.5 + `background: 'rgba(201,169,110,0.06)'`
- Text CTA: `group flex items-center gap-4 text-xs tracking-[0.2em] uppercase` + `———›` arrow span with `group-hover:translate-x-2`
- Status pills: `uppercase text-[9px] tracking-[0.22em] px-2.5 py-1` with gold hairline border

## CSS classes added
- `.glass-panel` — dark version: `bg-[rgba(10,10,10,0.85)] backdrop-blur-[16px]` with gold border
- `.ob-border` / `.ob-border-strong` — gold hairline/strong border utilities
- `.noise-overlay` — fixed film-grain overlay (opacity 0.06)

## Components updated
- `index.css` — complete palette rewrite, dark-only (no light/dark split)
- `App.tsx` — LandingPage fully redesigned; Clerk modal inherits gold primary
- `Layout.tsx` — minimal top nav (serif italic wordmark + avatar); dark mobile bottom nav
- `Home.tsx` — 88px italic serif greeting; aspect-[4/5] portrait cards; text-link CTA; Obsidian empty state
- `EventHub.tsx` — editorial text hero (no image card); gold-dot timeline stepper; hairline progress section; text-link quick-nav; no rounded corners
- `EventChat.tsx` — dark header; square message bubbles; rectangular input; thin-border chips
- `EventOptions.tsx` — dark plan cards; square layout; gold pricing block; text-link CTA
- `NewEvent.tsx` — square SelectCard/Pill; gold progress hairline; text-link continue buttons; all step headers use Obsidian type ramp

**Why:** User selected Obsidian from three canvas mockup directions. The system deliberately has no light mode — the app is always dark.

**How to apply:** Any new page should use inline `style={{ color: '#f5f0e8' }}` for headings, `'#a89880'` for muted text (not `#8a7a65` — fails contrast), `'#c9a96e'` for gold accents, and the hairline border pattern above. Avoid `rounded-2xl`, `rounded-3xl`, `rounded-full` on non-circular elements. Never use text below 11px. Never use `font-light` — body defaults to weight 400. Selection dots: min 15–16px diameter, 2px border.
