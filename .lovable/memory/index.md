# Memory: index.md
Precifica3D — plataforma de precificação de impressão 3D

## Design System
- Theme: dark mode (class="dark" on html)
- Primary: HSL 210 65% 52% (blue, from logo)
- Accent/Gold: HSL 43 56% 56% (gold, from logo)
- Neon glow: HSL 210 65% 52% (blue glow)
- Background: HSL 222 30% 8%
- Card: HSL 222 25% 11%
- Fonts: Inter (body), JetBrains Mono (numbers/code)
- Custom utilities: .neon-glow, .neon-text, .glass
- Logo: src/assets/logo-precifica3d.png (gold+blue identity)
- 3D printer background: src/assets/3d-printer-bg.png

## Architecture
- Supabase for auth + data persistence
- Edge Functions: energy-tariff, margin-suggestion (Lovable AI Gateway)
- Greenn + Make for payment webhooks (NOT edge function)
- IBGE API for Brazilian cities
- Preset printers: Bambu Lab, Creality, Prusa, FLSUN

## Pages
- /login AuthPage (two-column layout)
- / Dashboard
- /printers Manage printers
- /new New pricing/quote
- /history Quote history
- /reports Reports (Pro only)
- /planos Plans page
- /settings Default values
