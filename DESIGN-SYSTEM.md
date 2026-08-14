# Church Scheduler — Design System

Design contract for the React/Vite/Supabase app. Source of truth is the approved
v1 mockup at `media/church-scheduler-mockups/v1.html` (and its render `v1.png`).
Do not introduce raw Tailwind defaults (slate/stone/blue/red/green/Inter) — use
the tokens below.

## Palette

Tokens live in `src/index.css` under `@theme`. Each `--color-X` maps to Tailwind
utilities `bg-X`, `text-X`, `border-X`, etc.

| Token             | Hex       | Use                                                |
| ----------------- | --------- | -------------------------------------------------- |
| `cream`           | `#FAF7F2` | page background                                    |
| `warm-white`      | `#FFFBF5` | elevated surfaces, input fills                     |
| `white`           | `#FFFFFF` | card surfaces (Tailwind built-in)                  |
| `burgundy`        | `#7A2E3B` | primary accent: headings, primary buttons          |
| `burgundy-light`  | `#A84756` | primary button hover                               |
| `burgundy-ghost`  | `#F5E8EA` | subtle burgundy tint (selected rows, focus)        |
| `brown`           | `#5C4334` | card headings, emphasized body text                |
| `brown-light`     | `#8B6F5C` | secondary/muted body text                          |
| `sage`            | `#48593D` | success text/accent (darkened for contrast)        |
| `sage-light`      | `#E8EDE3` | success background                                 |
| `gold`            | `#B8943E` | gold accent                                        |
| `gold-light`      | `#F7F0E0` | gold tint background                               |
| `rose`            | `#943030` | error/destructive text (darkened for contrast)     |
| `rose-light`      | `#F5E8E8` | error background                                   |
| `amber`           | `#8A5E12` | warning text (darkened for contrast)               |
| `amber-light`     | `#F7EDD8` | warning background                                 |
| `warm-border`     | `#E6DDD4` | borders, dividers, hairlines                       |
| `ink`             | `#2C2418` | base body text (mockup `--text`)                   |
| `muted`           | `#7A7062` | muted text, eyebrow labels (mockup `--text-muted`) |

> Note: the mockup's raw accents are `sage #7A8B6F`, `rose #C45B5B`,
> `amber #C4963C`. We ship the darkened variants above as the *text* color so
> small badge/stat labels remain legible against their `*-light` backgrounds.
> Keep the `*-light` backgrounds identical to the mockup.

## Typography

- **Headings (H1/H2/page titles):** `font-serif` (Georgia) — `text-burgundy` or
  `text-brown`, weight 400–700. Never the default Inter.
- **Body:** system sans (`font-sans`, set on `body`).
- **Eyebrow / section labels:** `text-xs uppercase tracking-widest text-muted`
  (or `text-brown-light`), sans.
- **Buttons / inputs / tables / badges:** system sans.

Scale used across the app:

| Element              | Classes                                              |
| -------------------- | ---------------------------------------------------- |
| Page title (H1)      | `text-3xl font-serif font-bold text-burgundy`        |
| Card heading (H2)    | `text-xl font-serif font-bold text-burgundy`         |
| Card sub-head (H3)   | `text-lg font-serif font-semibold text-brown`        |
| Eyebrow label        | `text-xs uppercase tracking-widest text-muted`       |
| Body                 | `text-base text-ink` (default)                       |
| Muted                | `text-sm text-brown-light` / `text-xs text-muted`    |

## Cards

White surface, rounded, hairline warm border, faint shadow:

```
bg-white rounded-xl border border-warm-border shadow-sm p-6
```

## Status badges

Semantic colors (component: `src/components/Badge.jsx`):

| Status      | Variant                                        |
| ----------- | ---------------------------------------------- |
| `booked`    | `bg-sage-light text-sage` (success)            |
| `pending`   | `bg-amber-light text-amber` (warn)             |
| `completed` | `bg-cream text-muted border border-warm-border` (neutral) |
| `cancelled` | `bg-rose-light text-rose` (error)              |
| `visited`   | `bg-sage-light text-sage`                      |
| `attempted` | `bg-amber-light text-amber`                    |
| `no_contact`| `bg-rose-light text-rose`                      |

Pill shape: `inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide`.

## Buttons

Min 44px touch target, `rounded-lg`, system sans, semibold.

| Type     | Classes                                                              |
| -------- | -------------------------------------------------------------------- |
| Primary  | `bg-burgundy text-white hover:bg-burgundy-light`                     |
| Outline  | `border-[1.5px] border-warm-border text-brown hover:border-brown`    |
| Ghost    | `text-burgundy hover:text-burgundy-light` (no bg/border)             |
| Small    | `px-3 py-1 text-xs` (ghost/outline only, for table rows)             |

## Interviewer stat cards

Three pastel tints rotated per interviewer (mockup: Cole→amber, Kawika→sage,
Sean→rose). Centered layout: name (serif), big `X/Y` number (serif, tinted),
`Z% booked` subtitle (sans, muted).

```
{pastel} = { 'bg-amber-light text-amber' | 'bg-sage-light text-sage' | 'bg-rose-light text-rose' }
```

## Success ("Booked!") card

Sage-tinted card: `bg-sage-light border border-sage rounded-xl text-center`.
Sage checkmark icon (stroke `#48593D`), `Booked!` in `text-sage` serif, brown
body text, then: primary burgundy "Add to Google Calendar", outline "Download
.ics", ghost "Book another →".

## Section dividers / labels

Uppercase letter-spaced eyebrows mark sections and page context:

```
text-xs uppercase tracking-widest text-muted
```

Full-width centered dividers (mockup `.section-divider`) are used only to
annotate mockup screens and are not part of the in-app UI.

## Inputs

`min-h-[44px] border-[1.5px] border-warm-border rounded-md bg-white text-ink`
with focus `focus:border-burgundy focus:ring focus:ring-burgundy-light`.
