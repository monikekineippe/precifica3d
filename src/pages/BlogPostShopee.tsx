import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowRight } from "lucide-react";
import logo from "@/assets/logo-precifica3d.png";

const FAQ = [
  {
    q: "A Shopee cobra taxa sobre o frete também?",
    a: "Depende da modalidade. Em vendas com frete grátis subsidiado pela Shopee, a taxa é cobrada sobre o valor do produto. Verifique sempre as condições atuais no painel do vendedor pois as taxas podem mudar.",
  },
  {
    q: "Vale a pena vender na Shopee com taxas de 14%?",
    a: "Vale se você calcular o preço corretamente. A Shopee tem volume alto de visitantes e pode trazer muitas vendas. O erro é não repassar as taxas ao preço de venda.",
  },
  {
    q: "Posso usar o mesmo preço no Mercado Livre e na Shopee?",
    a: "Não. As taxas são diferentes e o preço precisa ser calculado separadamente para cada plataforma. O Gestão3D faz esse cálculo automaticamente.",
  },
];

const TITLE = "Como Vender Impressão 3D na Shopee com Lucro | Gestão3D";
const DESCRIPTION =
  "Aprenda a precificar suas peças 3D para a Shopee considerando as taxas reais da plataforma. Veja quanto cobrar para não vender no prejuízo.";
const URL = "https://gestao3d.agenciaai.com.br/blog/como-vender-impressao-3d-shopee-com-lucro";

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl md:text-3xl font-bold mt-12 mb-4 text-foreground">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">{children}</p>
);

const BlogPostShopee = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Como vender impressão 3D na Shopee com lucro",
          description: DESCRIPTION,
          author: { "@type": "Organization", name: "Gestão3D" },
          publisher: { "@type": "Organization", name: "Gestão3D" },
          datePublished: "2026-06-06",
          mainEntityOfPage: URL,
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://gestao3d.agenciaai.com.br/" },
            { "@type": "ListItem", position: 2, name: "Blog", item: "https://gestao3d.agenciaai.com.br/blog" },
            { "@type": "ListItem", position: 3, name: "Como vender impressão 3D na Shopee com lucro", item: URL },
          ],
        })}</script>
      </Helmet>

      <nav className="fixed top-0 w-full z-50 bg-[#0B1020]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Gestão3D" className="h-10 object-contain" />
            <span className="font-bold text-xl hidden sm:block">
              Gestão<span className="text-primary">3D</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/blog" className="text-sm font-medium hover:text-primary transition-colors">Blog</Link>
            <Link to="/#planos" className="text-sm font-medium hover:text-primary transition-colors">Planos</Link>
            <Link to="/login"><Button variant="outline" size="sm">Entrar</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-primary text-primary-foreground">Criar Conta</Button></Link>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight size={14} />
            <Link to="/blog" className="hover:text-primary">Blog</Link>
            <ChevronRight size={14} />
            <span className="text-foreground">Como vender impressão 3D na Shopee com lucro</span>
          </nav>

          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">MARKETPLACE</Badge>

          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Como vender impressão 3D na Shopee com lucro
          </h1>

          <div className="text-sm text-muted-foreground mb-10 pb-6 border-b border-border">
            06 de junho de 2026 · 7 min de leitura
          </div>

          <P>
            A Shopee é uma das plataformas com maior volume de vendas de impressão 3D no Brasil. Mas muitos
            impressores cometem um erro crítico: usam o mesmo preço da venda direta sem considerar as taxas da
            plataforma. O resultado é uma margem muito menor do que imaginam, ou prejuízo direto.
          </P>
          <P>
            Neste artigo você vai aprender como calcular o preço correto para vender na Shopee e garantir lucro
            real em cada peça.
          </P>

          <H2>Quais são as taxas da Shopee para impressão 3D</H2>
          <P>
            A Shopee cobra taxas que variam por categoria. Para produtos na categoria de artesanato, decoração
            e personalizados, as taxas mais comuns são:
          </P>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 text-base md:text-lg">
            <li><strong className="text-foreground">Comissão da plataforma:</strong> 14% sobre o valor da venda</li>
            <li><strong className="text-foreground">Taxa de serviço:</strong> variável por categoria, geralmente entre R$ 2,00 e R$ 4,00 por pedido</li>
            <li><strong className="text-foreground">Frete subsidiado:</strong> em muitos casos a Shopee subsidia parte do frete, o que pode ser vantajoso</li>
          </ul>
          <P>
            Total de taxas estimado: 14% a 18% sobre o valor da venda dependendo da categoria e promoções
            ativas.
          </P>

          <H2>Por que o mesmo preço da venda direta não funciona na Shopee</H2>
          <P>
            Imagine que você vende uma peça diretamente por R$ 25,00 com custo de R$ 11,69 e lucro de R$ 13,31.
          </P>
          <P>Se você listar essa mesma peça na Shopee por R$ 25,00:</P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm space-y-1">
            <div className="flex justify-between"><span>Comissão 14%</span><span>R$ 3,50</span></div>
            <div className="flex justify-between"><span>Taxa de serviço</span><span>R$ 3,00</span></div>
            <div className="flex justify-between"><span>Valor líquido recebido</span><span>R$ 18,50</span></div>
            <div className="flex justify-between pt-2 mt-2 border-t border-border text-foreground">
              <span>Lucro real</span><span>R$ 18,50 − R$ 11,69 = R$ 6,81</span>
            </div>
          </div>
          <P>
            Seu lucro caiu de R$ 13,31 para R$ 6,81. Uma redução de 49% sem você perceber.
          </P>

          <H2>Como calcular o preço correto para a Shopee</H2>
          <P>A fórmula correta para calcular o preço na Shopee é:</P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Preço de venda = custo de produção / (1 − percentual de taxas − margem desejada)
          </div>
          <P>Exemplo com custo de R$ 11,69 e margem desejada de 50%:</P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Preço = R$ 11,69 / (1 − 0,14 − 0,50)<br/>
            Preço = R$ 11,69 / 0,36<br/>
            Preço = R$ 32,47
          </div>
          <P>Verificando:</P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm space-y-1">
            <div className="flex justify-between"><span>Valor de venda</span><span>R$ 32,47</span></div>
            <div className="flex justify-between"><span>Comissão 14%</span><span>R$ 4,55</span></div>
            <div className="flex justify-between"><span>Custo de produção</span><span>R$ 11,69</span></div>
            <div className="flex justify-between pt-2 mt-2 border-t border-border text-foreground">
              <span>Lucro líquido</span><span>R$ 16,23 (50% sobre o custo)</span>
            </div>
          </div>

          <H2>Comparativo de preços por plataforma</H2>
          <P>Para o mesmo produto com custo de R$ 11,69 e margem de 50%:</P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm space-y-1">
            <div className="flex justify-between"><span>Venda direta (sem taxa)</span><span>R$ 17,54</span></div>
            <div className="flex justify-between"><span>TikTok Shop (5%)</span><span>R$ 25,98</span></div>
            <div className="flex justify-between"><span>Amazon (12%)</span><span>R$ 30,76</span></div>
            <div className="flex justify-between text-foreground"><span>Shopee (14%)</span><span>R$ 32,47</span></div>
            <div className="flex justify-between"><span>Mercado Livre (13% + taxa fixa)</span><span>R$ 47,81</span></div>
          </div>
          <P>
            Cada plataforma exige um preço diferente para garantir a mesma margem. Usar o mesmo preço em todas
            significa perder lucro em alguma delas.
          </P>

          <H2>Dicas para vender bem na Shopee</H2>
          <P>
            <strong className="text-foreground">Fotos de qualidade:</strong> a Shopee é visual. Fotos com fundo
            branco e boa iluminação convertem mais.
          </P>
          <P>
            <strong className="text-foreground">Descrição completa:</strong> informe o material, as dimensões,
            o tempo de produção e as opções de cor disponíveis.
          </P>
          <P>
            <strong className="text-foreground">Preço competitivo com margem real:</strong> não baixe o preço
            para competir sem calcular o impacto na margem. Uma diferença de R$ 2,00 no preço pode eliminar
            completamente o lucro.
          </P>
          <P>
            <strong className="text-foreground">Use o frete gratuito estrategicamente:</strong> embutir o frete
            no preço da peça pode aumentar a conversão, mas precisa entrar no cálculo de custo.
          </P>
          <P>
            <strong className="text-foreground">Avaliações:</strong> peça avaliação para cada cliente
            satisfeito. A Shopee favorece vendedores com boas avaliações no algoritmo.
          </P>

          <H2>Como o Gestão3D ajuda quem vende na Shopee</H2>
          <P>
            O Gestão3D tem uma calculadora de marketplace integrada que calcula automaticamente o preço ideal
            para a Shopee, Mercado Livre, Amazon e TikTok Shop. Você informa o custo de produção e a margem
            desejada, e o sistema mostra o preço correto para cada plataforma com as taxas reais já descontadas.
          </P>

          <div className="my-10 text-center">
            <Link to="/marketplace">
              <Button size="lg" className="bg-primary text-primary-foreground font-bold neon-glow">
                Calcular meu preço para a Shopee grátis <ArrowRight size={18} />
              </Button>
            </Link>
          </div>

          <H2>Perguntas frequentes</H2>
          <div className="space-y-6 mt-6">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-2">{f.q}</h3>
                <p className="text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </article>
      </main>

      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground">
        © 2026 Gestão3D — Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default BlogPostShopee;
