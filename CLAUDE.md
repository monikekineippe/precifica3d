# CLAUDE.md

Contexto do projeto para sessões do Claude Code. Leia antes de mexer em qualquer coisa.

## Produto

- O produto se chama **Gestão3D**. O nome antigo Precifica3D ainda aparece no código, no nome do repositório e em vários arquivos. **Não renomeie nada** sem pedido explícito.
- App de precificação e gestão para quem vende peças impressas em 3D. Stack: React + TypeScript + Vite, Tailwind, shadcn/ui, Supabase (auth + banco).

## Banco de dados (Supabase, produção com dados reais)

O banco atende usuários reais. Cuidado redobrado com migrações e queries destrutivas.

Tabelas principais:

- `impressoras`: catálogo de impressoras. As pré-cadastradas têm `is_precadastrada = true` (40 modelos). Impressoras do usuário têm `is_precadastrada = false`.
- `orcamentos`: orçamentos salvos pelos usuários (53 no momento da escrita).
- `eventos_uso`: eventos de uso com `tipo` ("calculo" ou "orcamento"). É a fonte de contagem do limite mensal do plano Free.
- `user_settings`: preferências do usuário.
- `inventory`: estoque (insumos e produtos prontos, `category = "finished_product"` para peças finalizadas).

## Regras de negócio já implementadas (não alterar sem pedido explícito)

- **Energia**: o cálculo usa `consumo_medio_watts` com fallback para `consumo_watts`, e aplica fator **1.35** para materiais de alta temperatura.
- **Depreciação honesta**: com `origem_custo` valendo `'media_mercado'` ou `'informado'`, para deixar claro de onde veio o valor da impressora.
- **Comparador de canais de venda**: compara preço e lucro por canal (ver `src/lib/sales-channels.ts`).
- **Preço reverso**: o usuário informa o preço de venda e o app calcula margem e lucro.
- **Painel de resultado ao vivo**: `src/components/PricingResultPanel.tsx`.

## Régua de planos (aprovada)

- **Free**: calculadora completa e **10 cálculos por mês**.
- **Pro**: cálculos ilimitados, comparador de canais e relatórios.
- **Anual**: tudo do Pro mais exportação em PDF.

O limite do Free conta **cálculos** na tabela `eventos_uso` (`tipo = "calculo"`) no mês corrente, não orçamentos salvos. Essa contagem vive em `src/hooks/usePlanLimits.ts` e na verificação de `handleSave` em `src/pages/NewPricing.tsx`. Um limite antigo que contava linhas de `orcamentos` já foi substituído; não volte para o modelo antigo.

## Convenções de escrita e interface

- Todo texto em **português do Brasil**.
- **Sem travessão** em nenhum texto (nem de interface, nem de documentação, nem de commit). Use vírgula, dois pontos ou reformule a frase.
- Textos de interface **sem termos técnicos de impressão 3D** como PETG, hotend, slicer. Fale a língua de quem vende peça, não a de datasheet.
- Tom direto e próximo, como nos textos já existentes (por exemplo "Faça upgrade pra continuar sem limite").

## Convenções de código

- Componentes de UI em `src/components`, páginas em `src/pages`, hooks em `src/hooks`, utilitários e tipos em `src/lib`.
- Limites de plano centralizados em `src/hooks/usePlanLimits.ts` (cálculos do mês, impressoras customizadas, exportação, relatórios, histórico completo).
- Antes de dar por pronto: `npx tsc -p tsconfig.app.json --noEmit`, `npm run build` e `npx vitest run`.
