import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowRight } from "lucide-react";
import logo from "@/assets/logo-precifica3d.png";

const FAQ = [
  {
    q: "Preciso abandonar minha planilha para usar o Gestão3D?",
    a: "Não. Você pode usar os dois em paralelo no início. Muitos usuários começam calculando no Gestão3D e registrando as vendas na planilha até ganhar confiança no sistema.",
  },
  {
    q: "O Gestão3D funciona no celular?",
    a: "Sim. O sistema é responsivo e funciona em qualquer dispositivo com navegador.",
  },
  {
    q: "E se eu quiser exportar os dados?",
    a: "O Gestão3D permite exportar orçamentos e histórico de vendas em CSV para quem quiser manter um backup local.",
  },
];

const TITLE = "Planilha ou Sistema para Gestão de Impressão 3D | Gestão3D";
const DESCRIPTION =
  "Compare planilha e sistema de gestão para impressão 3D. Descubra qual é mais eficiente para controlar custos, estoque e lucro real no seu negócio.";
const URL = "https://gestao3d.agenciaai.com.br/blog/planilha-ou-sistema-gestao-impressao-3d";

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl md:text-3xl font-bold mt-12 mb-4 text-foreground">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">{children}</p>
);

const COMPARATIVO = [
  ["Custo real com energia da sua cidade", "Manual e sujeito a erro", "Automático com tarifa real da distribuidora"],
  ["Custo médio ponderado do filamento", "Manual", "Automático a cada nova compra"],
  ["Preço por marketplace com taxas reais", "Fórmula manual por plataforma", "Calculado automaticamente para 4 plataformas"],
  ["Baixa de estoque ao vender", "Manual", "Automático ao registrar a venda"],
  ["Histórico de orçamentos", "Planilha separada", "Integrado e pesquisável"],
  ["Alerta de estoque mínimo", "Não existe", "Configurável por item"],
  ["Dashboard com lucro do mês", "Tabela manual", "Atualizado em tempo real"],
  ["IA sugerindo margem por tipo de peça", "Não existe", "Integrado"],
];

const BlogPostPlanilha = () => {
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
          headline: "Planilha ou sistema para gestão de impressão 3D",
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
            { "@type": "ListItem", position: 3, name: "Planilha ou sistema para gestão de impressão 3D", item: URL },
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
            <span className="text-foreground">Planilha ou sistema para gestão de impressão 3D</span>
          </nav>

          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">GESTÃO</Badge>

          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Planilha ou sistema para gestão de impressão 3D
          </h1>

          <div className="text-sm text-muted-foreground mb-10 pb-6 border-b border-border">
            06 de junho de 2026 · 6 min de leitura
          </div>

          <P>
            A planilha é a ferramenta mais usada por impressores 3D para controlar custos e preços. Funciona no
            começo, mas tem limites claros que aparecem quando o negócio cresce. Neste artigo você vai ver
            quando a planilha ainda faz sentido e quando é hora de migrar para um sistema.
          </P>

          <H2>O que a planilha faz bem</H2>
          <P>
            Para quem está começando e tem poucos produtos e poucas vendas por mês, a planilha cobre o básico:
          </P>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 text-base md:text-lg">
            <li>Calcular o custo de uma peça manualmente</li>
            <li>Registrar vendas e gastos</li>
            <li>Acompanhar o faturamento do mês</li>
          </ul>
          <P>É gratuita, familiar e não exige aprendizado.</P>

          <H2>Os limites da planilha para impressão 3D</H2>
          <P>
            <strong className="text-foreground">Tarifa de energia manual:</strong> você precisa pesquisar e
            atualizar a tarifa da sua distribuidora sempre que ela mudar. Um erro nesse número afeta todos os
            cálculos.
          </P>
          <P>
            <strong className="text-foreground">Sem custo médio ponderado:</strong> quando você compra o mesmo
            filamento por preços diferentes em datas diferentes, a planilha não calcula automaticamente o custo
            médio real. Você precisa fazer isso manualmente.
          </P>
          <P>
            <strong className="text-foreground">Sem integração entre módulos:</strong> o custo calculado na aba
            de precificação não se conecta automaticamente ao registro de venda, que não se conecta ao
            estoque. Qualquer mudança precisa ser replicada manualmente em vários lugares.
          </P>
          <P>
            <strong className="text-foreground">Sem preço por marketplace:</strong> para calcular o preço
            correto para Shopee, Mercado Livre, Amazon e TikTok Shop, você precisaria de fórmulas separadas
            para cada plataforma e atualizar manualmente quando as taxas mudarem.
          </P>
          <P>
            <strong className="text-foreground">Sem histórico de orçamentos:</strong> toda vez que um cliente
            pede a mesma peça, você recalcula do zero.
          </P>
          <P>
            <strong className="text-foreground">Sem alertas de estoque:</strong> você não sabe que o filamento
            acabou até abrir a gaveta.
          </P>

          <H2>Comparativo direto</H2>
          <div className="rounded-lg border border-border bg-card overflow-hidden my-6">
            <div className="grid grid-cols-3 gap-2 p-3 text-xs md:text-sm font-semibold text-foreground border-b border-border bg-muted/30">
              <div>O que você precisa</div>
              <div>Planilha</div>
              <div>Gestão3D</div>
            </div>
            {COMPARATIVO.map(([item, planilha, sistema]) => (
              <div key={item} className="grid grid-cols-3 gap-2 p-3 text-xs md:text-sm border-b border-border last:border-b-0">
                <div className="text-foreground font-medium">{item}</div>
                <div className="text-muted-foreground">{planilha}</div>
                <div className="text-primary">{sistema}</div>
              </div>
            ))}
          </div>

          <H2>Quando a planilha ainda faz sentido</H2>
          <P>
            Se você imprime esporadicamente, tem menos de 5 peças no portfólio e menos de 20 vendas por mês, a
            planilha ainda é suficiente. O custo de aprender um sistema novo não compensa o ganho.
          </P>

          <H2>Quando é hora de migrar para um sistema</H2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 text-base md:text-lg">
            <li>Você erra frequentemente no preço e descobre o problema depois da venda.</li>
            <li>Você não sabe de cabeça quanto lucrou no mês passado.</li>
            <li>Você vende em marketplace e usa o mesmo preço da venda direta.</li>
            <li>Você tem mais de um tipo de filamento e não sabe o custo médio real de cada um.</li>
            <li>Seu estoque some sem você perceber.</li>
          </ul>
          <P>
            Se algum desses pontos se aplica ao seu negócio, o custo de continuar na planilha já é maior do que
            o custo de usar um sistema.
          </P>

          <H2>Por que o Gestão3D foi criado</H2>
          <P>
            O Gestão3D foi criado especificamente para impressores 3D que vendem, com todos os cálculos que uma
            planilha genérica não faz: tarifa real por distribuidora, depreciação por modelo de impressora,
            custo médio ponderado de filamento, preço por marketplace e controle integrado de caixa e estoque.
          </P>
          <P>
            O plano gratuito cobre os principais módulos sem limite de orçamentos. Você começa sem cartão de
            crédito e sem compromisso.
          </P>

          <div className="my-10 text-center">
            <Link to="/register">
              <Button size="lg" className="bg-primary text-primary-foreground font-bold neon-glow">
                Testar grátis agora <ArrowRight size={18} />
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

export default BlogPostPlanilha;
