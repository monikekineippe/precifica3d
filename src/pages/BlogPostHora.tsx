import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowRight } from "lucide-react";
import logo from "@/assets/logo-precifica3d.png";

const FAQ = [
  {
    q: "Posso cobrar o mesmo valor por hora para qualquer peça?",
    a: "Não. O custo por hora da máquina é fixo, mas o custo total da peça varia com o peso do filamento e o tempo de impressão. Uma peça leve e rápida tem custo total menor mesmo que o custo por hora seja igual.",
  },
  {
    q: "Devo incluir o custo do filamento no preço por hora?",
    a: "Não. O filamento é um custo variável que depende do peso de cada peça. Calcule separadamente e some ao custo de máquina para chegar ao custo total.",
  },
];

const TITLE = "Quanto Cobrar por Hora de Impressão 3D | Gestão3D";
const DESCRIPTION =
  "Descubra como calcular o valor correto da hora de impressão 3D considerando energia, depreciação, manutenção e mão de obra. Com exemplos reais.";
const URL = "https://gestao3d.agenciaai.com.br/blog/quanto-cobrar-hora-impressao-3d";

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl md:text-3xl font-bold mt-12 mb-4 text-foreground">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">{children}</p>
);

const BlogPostHora = () => {
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
          headline: "Quanto cobrar por hora de impressão 3D",
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
            { "@type": "ListItem", position: 3, name: "Quanto cobrar por hora de impressão 3D", item: URL },
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
            <span className="text-foreground">Quanto cobrar por hora de impressão 3D</span>
          </nav>

          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">PRECIFICAÇÃO</Badge>

          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Quanto cobrar por hora de impressão 3D
          </h1>

          <div className="text-sm text-muted-foreground mb-10 pb-6 border-b border-border">
            06 de junho de 2026 · 6 min de leitura
          </div>

          <P>
            Cobrar por hora é uma das formas mais comuns de precificar impressão 3D, mas poucos impressores
            sabem calcular esse valor corretamente. O resultado é um preço por hora que não cobre todos os
            custos reais da operação.
          </P>
          <P>
            Neste artigo você vai aprender a calcular o custo real por hora da sua impressão e como usar esse
            número para precificar qualquer peça com segurança.
          </P>

          <H2>O que compõe o custo por hora de impressão 3D</H2>
          <P>
            O custo por hora de impressão inclui quatro componentes fixos que acontecem independente da peça
            que você está imprimindo:
          </P>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 text-base md:text-lg">
            <li><strong className="text-foreground">Energia elétrica:</strong> o consumo da impressora em cada hora de operação</li>
            <li><strong className="text-foreground">Depreciação:</strong> o desgaste da máquina a cada hora de uso</li>
            <li><strong className="text-foreground">Manutenção:</strong> reserva para peças e reparos futuros</li>
            <li><strong className="text-foreground">Mão de obra:</strong> o custo do seu tempo ou de quem opera a máquina</li>
          </ul>

          <H2>Como calcular cada componente</H2>

          <h3 className="text-xl font-semibold mt-6 mb-2 text-foreground">Energia elétrica por hora</h3>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Fórmula: consumo em kW x tarifa em R$/kWh<br/>
            Exemplo: FLSUN Super Racer SR (360W) com tarifa de R$ 0,78/kWh<br/>
            Custo de energia = 0,36 x 0,78 = R$ 0,28/hora
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-2 text-foreground">Depreciação por hora</h3>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Fórmula: custo da impressora / vida útil em horas<br/>
            Exemplo: impressora de R$ 1.800 com vida útil de 5.000 horas<br/>
            Depreciação = R$ 1.800 / 5.000 = R$ 0,36/hora
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-2 text-foreground">Manutenção por hora</h3>
          <P>
            Uma referência comum no mercado é entre R$ 0,25 e R$ 0,60 por hora dependendo do modelo e da
            intensidade de uso. Para uma impressora de nível intermediário, R$ 0,40/hora é uma boa estimativa.
          </P>

          <h3 className="text-xl font-semibold mt-6 mb-2 text-foreground">Mão de obra por hora</h3>
          <P>
            O custo de mão de obra técnica para impressão 3D no Brasil varia entre R$ 35 e R$ 60 por hora. Mas
            atenção: a mão de obra não é gasta integralmente durante a impressão. Uma impressão de 4 horas
            pode exigir apenas 15 a 30 minutos do seu tempo (preparação, monitoramento e finalização).
          </P>
          <P>
            Uma forma prática é aplicar 15% do custo total de produção como referência de mão de obra.
          </P>

          <H2>Exemplo de custo por hora completo</H2>
          <div className="rounded-lg border border-border bg-card p-6 my-4 font-mono text-sm space-y-1">
            <div><strong className="text-foreground">Impressora:</strong> FLSUN Super Racer SR</div>
            <div className="flex justify-between"><span>Energia</span><span>R$ 0,28/hora</span></div>
            <div className="flex justify-between"><span>Depreciação</span><span>R$ 0,36/hora</span></div>
            <div className="flex justify-between"><span>Manutenção</span><span>R$ 0,40/hora</span></div>
            <div className="flex justify-between pt-2 mt-2 border-t border-border text-foreground">
              <span>Subtotal (sem mão de obra)</span><span>R$ 1,04/hora</span>
            </div>
          </div>
          <P>Com mão de obra de R$ 45/hora e 20% de participação real:</P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Mão de obra por hora de impressão: R$ 9,00/hora x 20% = R$ 1,80/hora
          </div>
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-6 my-4">
            <p className="text-foreground"><strong>Custo total por hora:</strong> <span className="text-primary font-bold">R$ 2,84/hora</span></p>
          </div>

          <H2>Como usar o custo por hora na precificação</H2>
          <P>
            Sabendo o custo por hora, calcular o custo de produção de qualquer peça fica simples:
          </P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Custo de máquina = custo por hora x horas de impressão
          </div>
          <P>Para uma peça de 2h30:</P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Custo de máquina = R$ 2,84 x 2,5 = R$ 7,10
          </div>
          <P>
            Some a isso o custo do filamento e você tem o custo total de produção antes de aplicar a margem.
          </P>

          <H2>O erro mais comum ao cobrar por hora</H2>
          <P>
            Muitos impressores definem um preço por hora no achismo, geralmente entre R$ 3 e R$ 5, sem
            calcular o custo real. Esse valor pode parecer razoável, mas quando você soma energia, depreciação
            e manutenção de uma impressora mais cara, o custo real pode ultrapassar R$ 4/hora só em custos
            fixos, sem contar a mão de obra.
          </P>
          <P>
            Impressoras mais potentes e caras têm custos por hora maiores. Uma Bambu Lab X1 Carbon de R$ 8.500
            com vida útil de 7.000 horas tem depreciação de R$ 1,21/hora, mais de 3 vezes a depreciação de uma
            FLSUN SR.
          </P>

          <H2>Calculando automaticamente com o Gestão3D</H2>
          <P>
            O Gestão3D calcula automaticamente o custo por hora da sua impressora com base nas especificações
            reais: consumo de energia com a tarifa da sua distribuidora, depreciação e manutenção por modelo.
            Você informa o tempo de impressão e o sistema aplica tudo no cálculo final.
          </P>

          <div className="my-10 text-center">
            <Link to="/register">
              <Button size="lg" className="bg-primary text-primary-foreground font-bold neon-glow">
                Calcular o custo da minha impressora grátis <ArrowRight size={18} />
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

export default BlogPostHora;
