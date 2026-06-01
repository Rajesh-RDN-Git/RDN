# Mobile App Assets

App icon, splash, and adaptive icon for iOS + Android.

## Required files

| File                | Dimensions         | Format                | Purpose                                                                                                        |
| ------------------- | ------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `icon.png`          | 1024×1024          | PNG (no transparency) | iOS + Play Store icon. Apple flattens transparency.                                                            |
| `splash.png`        | 1284×2778 (or any) | PNG                   | Splash screen. Centered on `#2563eb` background. Logo only — keep < 50% of canvas.                             |
| `adaptive-icon.png` | 1024×1024          | PNG (transparency OK) | Android 8+ adaptive icon foreground. Safe zone is center 66%. Background color set in `app.json` to `#2563eb`. |

## Optional

| File                    | Dimensions       | Purpose                            |
| ----------------------- | ---------------- | ---------------------------------- |
| `favicon.png`           | 48×48            | PWA fallback (not used for native) |
| `notification-icon.png` | 96×96 monochrome | Android notification tray icon     |

## Workflow

1. Designer produces master logo at 4096×4096 SVG/PNG
2. Export `icon.png` at 1024×1024 with rounded-corner safe zone (Apple auto-rounds)
3. Export `adaptive-icon.png` at 1024×1024 with logo in center 66% safe zone, transparent background
4. Export `splash.png` — logo on `#2563eb` background, 1284×2778 baseline
5. Drop here. Rebuild EAS: `eas build --platform all --profile preview`

## Current state

**Solid brand-color (`#2563eb`) placeholder PNGs are checked in** at every required dimension so EAS preview/dev builds compile without designer artwork. They are NOT store-grade. Replace before TestFlight or Play Internal submission.

Regenerate placeholders any time (no external deps; Node ≥ 22):

```bash
node apps/mobile/scripts/gen-placeholder-assets.mjs
```

Legacy ImageMagick recipe (for designers who prefer it):

```bash
# Solid color placeholder (1024x1024 blue square with text)
magick -size 1024x1024 xc:'#2563eb' -gravity center \
  -font Helvetica -pointsize 200 -fill white \
  -annotate +0+0 'RDN' icon.png
cp icon.png adaptive-icon.png
magick -size 1284x2778 xc:'#2563eb' -gravity center \
  -font Helvetica -pointsize 300 -fill white \
  -annotate +0+0 'RDN' splash.png
```
