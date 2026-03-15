Precifica3D — plataforma de precificação de impressão 3D, tema escuro com neon azul/verde

## Design System
- Theme: dark mode (class="dark" on html)
- Primary: HSL 173 80% 50% (teal/neon green)
- Accent: HSL 200 100% 60% (neon blue)
- Neon green: HSL 160 100% 50%
- Background: HSL 222 30% 8%
- Card: HSL 222 25% 11%
- Fonts: Inter (body), JetBrains Mono (numbers/code)
- Custom utilities: .neon-glow, .neon-text, .glass

## Architecture
- Supabase (Lovable Cloud) for auth, DB, edge functions
- Edge functions: energy-tariff (AI tariff lookup), margin-suggestion (AI margin)
- Greenn webhook processed by Make (make.com), NOT edge function
- IBGE API for Brazilian cities
- Preset printers: Bambu Lab, Creality, Prusa, FLSUN

## Plans
- Free: 2 quotes/month, 1 custom printer, no export/reports
- Pro: unlimited everything, R$ 29.90/month or R$ 239/year

## Pages
- / Dashboard
- /printers Manage printers
- /new New pricing/quote (with AI margin suggestion + scenario simulator)
- /history Quote history
- /reports Pro-only reports
- /planos Plans comparison
- /settings Default values + subscription
