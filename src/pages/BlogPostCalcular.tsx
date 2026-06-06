import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowRight } from "lucide-react";
import logo from "@/assets/logo-precifica3d.png";

const FAQ = [
  {
    q: "Posso usar o custo do filamento como base para o preço?",
    a: "Não. O filamento representa em média 60 a 70% do custo de produção. Usar só o filamento ignora energia, depreciação e mão de obra e resulta em margens muito menores do que você imagina.",
  },
  {
    q: "Quanto devo cobrar de margem de lucro na impressão 3D?",
    a: "Depende do tipo de peça. Peças decorativas e personalizadas comportam margens de 100% a 200%. Peças técnicas e funcionais costumam ter margens entre 50% e 100%. O mais importante é calcular primeiro o custo real para depois definir a margem.",
  },
  {
    q: "Como saber a tarifa de energia da minha cidade?",
    a: "Cada distribuidora publica sua tarifa no site da ANEEL. O Gestão3D busca automaticamente a tarifa correta por cidade.",
  },
];

const TITLE = "Como Calcular o Preço de uma Impressão 3D | Gestão3D";
const DESCRIPTION =
  "Guia completo para calcular o preço correto de qualquer impressão 3D. Filamento, energia, depreciação, mão de obra e margem. Sem chute, sem prejuízo.";
const URL = "https://gestao3d.agenciaai.com.br/blog/como-calcular-preco-impressao-3d";

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl md:text-3xl font-bold mt-12 mb-4 text-foreground">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">{children}</p>
);

const BlogPostCalcular = () => {
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
          headline: "Como calcular o preço de uma impressão 3D",
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
            { "@type": "ListItem", position: 3, name: "Como calcular o preço de uma impressão 3D", item: URL },
          ],
        })}</script>
      </Helmet>

      {/* Navigation */}
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
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight size={14} />
            <Link to="/blog" className="hover:text-primary">Blog</Link>
            <ChevronRight size={14} />
            <span className="text-foreground">Como calcular o preço de uma impressão 3D</span>
          </nav>

          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">PRECIFICAÇÃO</Badge>

          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Como calcular o preço de uma impressão 3D
          </h1>

          <div className="text-sm text-muted-foreground mb-10 pb-6 border-b border-border">
            06 de junho de 2026 · 7 min de leitura
          </div>

          <P>
            A maioria dos impressores 3D calcula o preço multiplicando o peso da peça pelo custo do filamento.
            Esse método ignora mais da metade dos custos reais de produção e é a principal razão pela qual
            muitos impressores trabalham no prejuízo sem perceber.
          </P>
          <P>
            Neste guia você vai aprender a calcular o preço correto de qualquer peça, considerando todos os
            custos que fazem diferença no lucro real.
          </P>

          <H2>O que entra no custo de uma impressão 3D</H2>
          <P>O custo completo de uma impressão 3D tem seis componentes:</P>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4 text-base md:text-lg">
            <li>Custo do filamento</li>
            <li>Custo de energia elétrica</li>
            <li>Depreciação da impressora</li>
            <li>Manutenção</li>
            <li>Mão de obra</li>
            <li>Embalagem e acessórios</li>
          </ol>
          <P>Vamos calcular cada um.</P>

          <H2>1. Custo do filamento</H2>
          <P>
            O custo do filamento é o mais fácil de calcular, mas tem um detalhe importante: você precisa usar
            o custo médio ponderado quando compra o mesmo filamento por preços diferentes.
          </P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Custo do filamento = (peso usado em gramas / 1000) x custo por kg
          </div>
          <P>
            <strong className="text-foreground">Exemplo prático:</strong> Você imprimiu uma peça de 85g usando
            PLA que custou R$ 89 o kg.
          </P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Custo do filamento = (85 / 1000) x 89 = R$ 7,57
          </div>

          <H2>2. Custo de energia elétrica</H2>
          <P>
            Esse é o custo mais esquecido. Cada impressora tem um consumo em watts e cada cidade tem uma
            tarifa de energia diferente.
          </P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Custo de energia = (consumo em kW) x (horas) x (tarifa R$/kWh)
          </div>
          <P>
            <strong className="text-foreground">Exemplo prático:</strong> Impressora de 360W, impressão de 2h30,
            tarifa de R$ 0,78/kWh.
          </P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Custo de energia = 0,36 x 2,5 x 0,78 = R$ 0,70
          </div>
          <P>
            <strong className="text-foreground">Dica:</strong> a tarifa de energia varia por distribuidora e por
            cidade. Uma calculadora que usa a tarifa real da sua cidade é muito mais precisa do que uma média
            nacional.
          </P>

          <H2>3. Depreciação da impressora</H2>
          <P>
            Sua impressora vai precisar ser substituída um dia. Esse custo precisa entrar no preço de cada peça.
          </P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Depreciação por hora = custo da impressora / vida útil em horas<br/>
            Custo de depreciação = depreciação por hora x horas de impressão
          </div>
          <P>
            <strong className="text-foreground">Exemplo prático:</strong> FLSUN Super Racer SR custou R$ 1.800 e
            tem vida útil estimada de 5.000 horas.
          </P>
          <div className="rounded-lg border border-border bg-card p-4 my-4 font-mono text-sm">
            Depreciação por hora = R$ 1.800 / 5.000 = R$ 0,36/hora<br/>
            Custo de depreciação = R$ 0,36 x 2,5 horas = R$ 0,90
          </div>

          <H2>4. Manutenção</H2>
          <P>
            Troca de bicos, lubrificação, peças desgastadas, falhas de impressão. Esse custo é real e precisa
            ser incluído.
          </P>
          <P>
            Uma referência de mercado: 15% a 20% sobre o custo de produção para cobrir manutenção e eventuais
            falhas.
          </P>
          <P>
            Alternativamente, você pode calcular com base no custo de manutenção da impressora por hora —
            geralmente entre R$ 0,25 e R$ 0,60 dependendo do modelo.
          </P>

          <H2>5. Mão de obra</H2>
          <P>
            Seu tempo tem valor. Mesmo que você seja o dono do negócio, o tempo gasto em preparar, monitorar
            e finalizar a impressão precisa ser remunerado.
          </P>
          <P>
            Referência de mercado: R$ 35 a R$ 60 por hora para trabalho técnico de impressão 3D no Brasil.
          </P>

          <H2>6. Embalagem e acessórios</H2>
          <P>
            Sacola, caixa, papel bolha, etiqueta, argola, chaveiro. Cada acessório tem um custo e precisa ser
            incluído no preço da peça.
          </P>

          <H2>Exemplo de cálculo completo</H2>
          <div className="rounded-lg border border-border bg-card p-6 my-4 space-y-1 text-muted-foreground">
            <p><strong className="text-foreground">Peça:</strong> Bola Fidget Texturizada</p>
            <p><strong className="text-foreground">Impressora:</strong> FLSUN Super Racer SR</p>
            <p><strong className="text-foreground">Tempo de impressão:</strong> 2h30</p>
            <p><strong className="text-foreground">Peso do filamento:</strong> 85g</p>
            <p><strong className="text-foreground">Filamento:</strong> PLA a R$ 89/kg</p>
            <p><strong className="text-foreground">Tarifa de energia:</strong> R$ 0,78/kWh (São Paulo)</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 my-4 font-mono text-sm space-y-1">
            <div className="flex justify-between"><span>Filamento</span><span>R$ 7,57</span></div>
            <div className="flex justify-between"><span>Energia</span><span>R$ 0,70</span></div>
            <div className="flex justify-between"><span>Depreciação</span><span>R$ 0,90</span></div>
            <div className="flex justify-between"><span>Manutenção</span><span>R$ 1,00</span></div>
            <div className="flex justify-between"><span>Mão de obra (15%)</span><span>R$ 1,52</span></div>
            <div className="flex justify-between pt-2 mt-2 border-t border-border text-foreground font-bold">
              <span>Total de custo</span><span>R$ 11,69</span>
            </div>
          </div>
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-6 my-4 space-y-1">
            <p className="text-foreground"><strong>Com margem de 150%:</strong> Preço sugerido <span className="text-primary font-bold">R$ 29,23</span></p>
            <p className="text-foreground"><strong>Lucro líquido por peça:</strong> <span className="text-primary font-bold">R$ 17,54</span></p>
          </div>

          <H2>Como fazer esse cálculo automaticamente</H2>
          <P>
            Fazer esse cálculo manualmente para cada peça é demorado e sujeito a erros. O Gestão3D automatiza
            todo esse processo:
          </P>
          <P>
            Você informa a impressora, o tempo de impressão e o filamento. O sistema calcula filamento, energia
            com a tarifa real da sua distribuidora, depreciação, manutenção e mão de obra em segundos. A IA
            ainda sugere a margem ideal para o tipo de peça e mostra o preço certo para cada marketplace.
          </P>

          <div className="my-10 text-center">
            <Link to="/register">
              <Button size="lg" className="bg-primary text-primary-foreground font-bold neon-glow">
                Calcular o preço da minha peça grátis <ArrowRight size={18} />
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

export default BlogPostCalcular;
