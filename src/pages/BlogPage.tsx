import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import logo from "@/assets/logo-precifica3d.png";
import { Button } from "@/components/ui/button";

const POSTS = [
  {
    tag: "Precificação",
    title: "Como calcular o preço de uma impressão 3D",
    description:
      "Aprenda a calcular o custo real de cada peça considerando filamento, energia, depreciação e mão de obra. Sem chute, sem planilha.",
    href: "/blog/como-calcular-preco-impressao-3d",
    date: "06 de junho de 2026",
    readTime: "7 min",
  },
  {
    tag: "Precificação",
    title: "Quanto cobrar por hora de impressão 3D",
    description:
      "Descubra como calcular o valor correto da hora de impressão 3D considerando energia, depreciação, manutenção e mão de obra.",
    href: "/blog/quanto-cobrar-hora-impressao-3d",
    date: "06 de junho de 2026",
    readTime: "6 min",
  },
  {
    tag: "Marketplace",
    title: "Como vender impressão 3D na Shopee com lucro",
    description:
      "Aprenda a precificar suas peças 3D para a Shopee considerando as taxas reais da plataforma e garanta lucro real em cada venda.",
    href: "/blog/como-vender-impressao-3d-shopee-com-lucro",
    date: "06 de junho de 2026",
    readTime: "7 min",
  },
];

const BlogPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Helmet>
        <title>Blog | Gestão3D — Dicas de Precificação e Gestão para Impressão 3D</title>
        <meta
          name="description"
          content="Artigos práticos sobre precificação, estoque, margem de lucro e gestão financeira para quem vende impressão 3D no Brasil."
        />
        <link rel="canonical" href="https://gestao3d.agenciaai.com.br/blog" />
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
            <Link to="/blog" className="text-sm font-medium text-primary transition-colors">
              Blog
            </Link>
            <Link to="/#planos" className="text-sm font-medium hover:text-primary transition-colors">
              Planos
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-primary text-primary-foreground">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Blog <span className="text-primary">Gestão3D</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conteúdo prático para impressores 3D que querem lucrar de verdade
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {POSTS.map((post) => (
              <Link
                key={post.href}
                to={post.href}
                className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-colors flex flex-col"
              >
                <Badge variant="outline" className="self-start mb-4 border-primary/40 text-primary">
                  {post.tag}
                </Badge>
                <h2 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-6 flex-1">
                  {post.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} /> {post.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {post.readTime}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-primary font-medium">
                  Ler artigo <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogPage;
