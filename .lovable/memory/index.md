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
- Lovable Cloud (Supabase) for auth, DB, edge functions
- Greenn + Make for payment webhooks (no edge function for webhook)
- Edge functions: energy-tariff, margin-suggestion (Lovable AI Gateway)
- IBGE API for Brazilian cities
- Preset printers: Bambu Lab, Creality, Prusa, FLSUN
- Free plan: 2 quotes/month, 1 custom printer
- Pro plan: unlimited

## Auth
- Single AuthPage.tsx with two-column layout (product showcase + toggle login/signup)
- ForgotPasswordPage.tsx also two-column
- ResetPasswordPage for password recovery flow

## Pages
- / Dashboard
- /printers Manage printers
- /new New pricing/quote
- /history Quote history
- /reports Pro-only reports
- /planos Plans comparison
- /settings Default values + subscription
