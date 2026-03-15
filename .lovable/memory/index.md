Precifica3D — plataforma de precificação de impressão 3D

## Design System
- Theme: dark mode (class="dark" on html)
- Primary: HSL 178 70% 42% (teal/cyan, from logo)
- Accent: HSL 195 75% 45% (blue-cyan, from logo)
- Background: HSL 200 25% 7%
- Card: HSL 200 22% 10%
- Fonts: Inter (body), JetBrains Mono (numbers/code)
- Custom utilities: .neon-glow, .neon-text, .glass
- Logo full: src/assets/logo-precifica3d.png (teal 3D printer + text)
- Logo icon: src/assets/logo-icon.png (teal 3D printer only)
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
