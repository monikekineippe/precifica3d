import { Link } from "react-router-dom";
import PlansPage from "./PlansPage";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calculator, Package, LayoutDashboard, Brain, Zap, ArrowRight, ChevronDown } from "lucide-react";
import logo from "@/assets/logo-precifica3d.png";
import printerBg from "@/assets/3d-printer-bg.png";
import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "Como calcular o preço de uma impressão 3D?",
    answer: "O preço deve considerar filamento, energia, tempo de impressão, mão de obra, manutenção, margem de lucro e complexidade da peça. Nossa plataforma automatiza todo esse cálculo para você."
  },
  {
    question: "Como controlar estoque de filamento para impressão 3D?",
    answer: "Com um sistema de gestão, é possível acompanhar entrada e saída de filamentos, cores, tipos de material, consumo por peça e necessidade de reposição de forma automática."
  },
  {
    question: "Qual o melhor software para precificar impressão 3D?",
    answer: "O ideal é usar uma plataforma que calcule custos reais, sugira margens com IA e ajude a controlar estoque, pedidos e lucratividade em um único lugar."
  },
  {
    question: "Como saber se estou tendo lucro com impressão 3D?",
    answer: "Você precisa comparar o custo total de produção com o preço de venda, considerando material, energia, tempo, manutenção e margem. O Gestão3D oferece relatórios detalhados para garantir sua saúde financeira."
  }
];

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* JSON-LD for SoftwareApplication and FAQ */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Gestão3D",
          "operatingSystem": "Web",
          "applicationCategory": "BusinessApplication",
          "description": "Plataforma de gestão, estoque e precificação para serviços de impressão 3D.",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "BRL"
          }
        })}
      </script>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Software de gestão para impressão 3D com controle de estoque, custos e precificação inteligente" className="h-10 object-contain" />
            <span className="font-bold text-xl hidden sm:block">Gestão<span className="text-primary">3D</span></span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#planos" className="text-sm font-medium hover:text-primary transition-colors">Planos</a>
            <Link to="/login">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-primary text-primary-foreground">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
          style={{ backgroundImage: `url(${printerBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/80 to-background pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Descubra o custo real de cada peça — e <span className="text-primary">pare de trabalhar no prejuízo</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              O Gestão3D calcula automaticamente filamento, energia, mão de obra e depreciação da sua impressora. Saiba exatamente quanto cobrar e quanto está lucrando em cada venda.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="h-14 px-8 text-lg font-bold bg-primary text-primary-foreground neon-glow group">
                  Começar Agora Grátis
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#planos">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold">
                  Ver Planos
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Problem & Solution */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold uppercase tracking-wider">
                O Problema
              </div>
              <h2 className="text-3xl font-bold">Muitos impressores 3D vendem sem saber o custo real</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Calcular o preço apenas "por grama" é um erro comum que destrói o lucro. Você esquece a energia, a depreciação da máquina, as falhas e o tempo de pós-processamento. Sem controle, você paga para trabalhar.
              </p>
            </div>
            <div className="space-y-6">
              <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold uppercase tracking-wider">
                A Solução
              </div>
              <h2 className="text-3xl font-bold">Uma plataforma completa de gestão, estoque e precificação</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                O Gestão3D foi criado para transformar seu hobby em um negócio lucrativo. Automatizamos os cálculos complexos e damos a você visão clara de cada centavo que entra e sai.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Funcionalidades Profissionais</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Tudo o que você precisa para dominar sua produção e suas finanças.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Calculator className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Precificação Inteligente</h3>
              <p className="text-muted-foreground">Cálculo automático considerando filamento, energia, mão de obra e manutenção da máquina.</p>
            </div>
            
            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Package className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Controle de Estoque</h3>
              <p className="text-muted-foreground">Gerencie seus filamentos, cores e tipos de material. Saiba exatamente quando repor.</p>
            </div>
            
            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <LayoutDashboard className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Gestão de Pedidos</h3>
              <p className="text-muted-foreground">Organize suas encomendas e prazos em um dashboard intuitivo e profissional.</p>
            </div>
            
            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Brain className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">IA Sugere Margem</h3>
              <p className="text-muted-foreground">Nossa inteligência artificial analisa o cenário e sugere a melhor margem de lucro.</p>
            </div>
            
            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Zap className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Energia por Cidade</h3>
              <p className="text-muted-foreground">Busca automática das tarifas de energia atualizadas diretamente da sua distribuidora.</p>
            </div>
            
            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <CheckCircle2 className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Simulador de Lucro</h3>
              <p className="text-muted-foreground">Compare cenários de venda e descubra como aumentar sua rentabilidade em cada peça.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interstitial CTA */}
      <section className="py-20 bg-primary/10 border-y border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para saber o preço certo de cada peça?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Crie sua conta grátis agora. Sem cartão de crédito, sem compromisso.
          </p>
          <Link to="/signup">
            <Button size="lg" className="h-14 px-10 text-lg font-bold bg-primary text-primary-foreground neon-glow group">
              Criar Conta Grátis
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-20 bg-muted/30 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Para quem é o Gestão3D?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {["Makers", "Oficinas 3D", "Negócios de Impressão", "Prestadores de Serviço", "Lojas de Personalizados"].map(item => (
              <span key={item} className="px-6 py-3 rounded-full bg-background border border-border font-medium text-lg">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary/5 rounded-3xl p-8 md:p-16 border border-primary/20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-8">Por que escolher o Gestão3D?</h2>
                <ul className="space-y-4">
                  {[
                    "Mais lucro em cada peça vendida",
                    "Menos erros de precificação",
                    "Controle total do seu estoque",
                    "Profissionalização do seu negócio",
                    "Economia de tempo com automação"
                  ].map(benefit => (
                    <li key={benefit} className="flex items-center gap-3">
                      <CheckCircle2 className="text-primary shrink-0" />
                      <span className="text-lg font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-square bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl blur-2xl absolute inset-0 -z-10" />
                <img 
                  src={logo} 
                  alt="Ícone de plataforma para gestão, estoque e precificação de serviços de impressão 3D com inteligência artificial" 
                  className="w-full h-auto max-w-sm mx-auto drop-shadow-2xl" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">Perguntas Frequentes (FAQ)</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className="border border-border rounded-xl overflow-hidden">
                <button 
                  className="w-full p-5 text-left flex items-center justify-between bg-card hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-bold">{item.question}</span>
                  <ChevronDown className={`transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                </button>
                {openFaq === index && (
                  <div className="p-5 bg-card border-t border-border text-muted-foreground leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="planos" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos que cabem no seu negócio</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Escolha a melhor opção para profissionalizar sua produção hoje mesmo.</p>
          </div>
          <PlansPage isEmbedded={true} />
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-20 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para profissionalizar seu negócio 3D?</h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Junte-se a centenas de impressores que já estão lucrando mais com o Gestão3D.
          </p>
          <Link to="/signup">
            <Button size="lg" className="h-14 px-10 text-lg font-bold bg-primary text-primary-foreground neon-glow">
              Criar Minha Conta Grátis
            </Button>
          </Link>
          <div className="mt-20 flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-border/50 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Gestão3D" className="h-6 object-contain grayscale opacity-50" />
              <span>© 2024 Gestão3D. Todos os direitos reservados.</span>
            </div>
            <div className="flex gap-6">
              <Link to="/login" className="hover:text-primary transition-colors">Entrar</Link>
              <a href="#planos" className="hover:text-primary transition-colors">Planos</a>
              <a href="#" className="hover:text-primary transition-colors">Termos</a>
              <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
