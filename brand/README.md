# Lazy Protocol — Brand Assets Index

## Quick Reference: What to Use Where

| Use Case | File |
|----------|------|
| **Website navbar** | `logo-lockup-dark.png` (light bg) or `logo-lockup-light.png` (dark bg) |
| **Favicon** | `favicon-32.png` + `favicon-16.png` |
| **iOS home screen** | `apple-touch-icon.png` |
| **Twitter header** | `twitter-header-centered.png` |
| **Twitter profile pic** | `twitter-pfp-icon.png` |
| **Link previews (OG)** | `og-image.png` |
| **lazyUSD token icon** | `lazyusd-token-b.png` (recommended) |

---

## All Assets by Category

### 🌐 Website Logo (Header/Navbar)

| File | Description | Background |
|------|-------------|------------|
| `logo-lockup-dark` | L icon + "lazy" wordmark | Use on light backgrounds |
| `logo-lockup-light` | L icon + "lazy" wordmark | Use on dark backgrounds |
| `logo-lockup-outline-dark` | Outlined L + wordmark | Light backgrounds, transparent feel |
| `logo-lockup-outline-light` | Outlined L + wordmark | Dark backgrounds, transparent feel |

### 📝 Wordmark Only (No Icon)

| File | Description | Background |
|------|-------------|------------|
| `logo-wordmark-dark` | Just "lazy" text | Light backgrounds |
| `logo-wordmark-light` | Just "lazy" text | Dark backgrounds |
| `logo-tagline-dark` | "lazy" + "Yield on autopilot." | Light backgrounds |
| `logo-tagline-light` | "lazy" + "Yield on autopilot." | Dark backgrounds |

### 🎯 Icon Mark (Standalone)

| File | Size | Description |
|------|------|-------------|
| `logo-icon` | 400x400 | L mark with gold dot (app icon, large displays) |

### 🔖 Favicons

| File | Size | Usage |
|------|------|-------|
| `favicon-16` | 16x16 | Browser tab (tiny) |
| `favicon-32` | 32x32 | Browser tab (standard) |
| `apple-touch-icon` | 180x180 | iOS "Add to Home Screen" |

### 🐦 Twitter/X Assets

| File | Size | Usage |
|------|------|-------|
| `twitter-header-centered` | 1500x500 | **Recommended** — "lazy" + tagline centered |
| `twitter-header-clean` | 1500x500 | Tagline only, right-aligned |
| `twitter-header-wordmark` | 1500x500 | "lazy" left, tagline right |
| `twitter-header-gold-accent` | 1500x500 | Gold bar + wordmark |
| `twitter-header` | 1500x500 | With subtle grid texture |
| `twitter-pfp` | 400x400 | "lazy" wordmark as avatar |
| `twitter-pfp-icon` | 400x400 | **Recommended** — L mark with gold dot |

### 🔗 Social Sharing (OG Images)

| File | Size | Description |
|------|------|-------------|
| `og-image` | 1200x630 | Logo + tagline + URL (full) |
| `og-image-minimal` | 1200x630 | Logo only (clean) |

### 💰 lazyUSD Token Icon

| File | Description | Recommended? |
|------|-------------|--------------|
| `lazyusd-token-a` | Navy + white $ (minimal) | |
| `lazyusd-token-b` | Navy + gold ring + white $ | ✅ **Yes** |
| `lazyusd-token-c` | Gold border + navy + white $ | Alternative |
| `lazyusd-token-d` | Navy + gold $ | |
| `lazyusd-token-e` | Double ring detail + white $ | |
| `lazyusd-token-f` | White $ + gold accent bar | |

### 🎨 Demo/Reference

| File | Description |
|------|-------------|
| `app-template.html` | Full interactive website mockup — open in browser |

---

## File Formats

Every asset exists in both formats:
- `.svg` — Vector, scalable, editable
- `.png` — Raster, ready to upload

---

## Brand Colors (Reference)

```css
--lazy-navy: #1a2332;    /* Primary background */
--drift-white: #FAFBFC;  /* Light background, text on dark */
--yield-gold: #C4A052;   /* Accents, earnings */
--slate: #64748B;        /* Secondary text */
--ink: #0F172A;          /* Body text */
```

---

## HTML Snippet (Copy-Paste)

```html
<!-- Favicons -->
<link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/brand/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png">

<!-- Open Graph -->
<meta property="og:image" content="https://getlazy.xyz/brand/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://getlazy.xyz/brand/og-image.png">
```

---

## Need Something Else?

Assets not covered:
- [ ] lazyETH token icon
- [ ] lazyHYPE token icon
- [ ] Sloth mascot logo (pending design direction)
- [ ] Email header
- [ ] Presentation template
