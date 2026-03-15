# Memory: index.md
Updated: now

Print Price — plataforma de precificação de impressão 3D, tema escuro com neon azul/verde

## Design System
- Theme: dark mode (class="dark" on html)
- Primary: HSL 173 80% 50% (teal/neon green)
- Accent: HSL 200 100% 60% (neon blue)
- Background: HSL 222 30% 8%
- Card: HSL 222 25% 11%
- Fonts: Inter (body), JetBrains Mono (numbers/code)
- Custom utilities: .neon-glow, .neon-text, .glass

## Architecture
- Supabase backend (Lovable Cloud): profiles, printers, quotes, user_settings tables
- Auth: email/password with signup, login, forgot/reset password
- Plans: Free (2 quotes/month, 2 custom printers) vs Pro (unlimited)
- Greenn webhook edge function for plan updates (verify_jwt=false)
- IBGE API for Brazilian cities
- Preset printers: Bambu Lab, Creality, Prusa, FLSUN (seeded per user)

## Pages
- / Dashboard (protected)
- /printers Manage printers (protected)
- /new New pricing/quote (protected)
- /history Quote history (protected)
- /reports Reports - Pro only (protected)
- /planos Plans comparison (protected)
- /settings Defaults + subscription (protected)
- /login, /signup, /forgot-password, /reset-password (public)
