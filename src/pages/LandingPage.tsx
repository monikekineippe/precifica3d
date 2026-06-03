import { Link } from "react-router-dom";
import PlansPage from "./PlansPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calculator, Package, LayoutDashboard, Brain, Zap, ArrowRight, ChevronDown, Printer, Box, Store, Tag, TrendingUp, Wallet, ShoppingCart, Circle, ZoomIn, X, TrendingDown, AlertTriangle, HelpCircle } from "lucide-react";
import logo from "@/assets/logo-precifica3d.png";
import printerBg from "@/assets/3d-printer-bg.png";
import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "Como calcular o preço de uma impressão 3D?",
    answer: "O preço correto de uma impressão 3D deve incluir: custo do filamento usado, consumo de energia da impressora, depreciação do equipamento, manutenção, mão de obra e embalagem. Somar apenas o filamento é o erro mais comum e o que mais destrói o lucro. O Gestão3D calcula todos esses componentes automaticamente assim que você informa o tempo de impressão e o peso da peça."
  },
  {
    question: "Como controlar estoque de filamento para impressão 3D?",
    answer: "O controle de estoque de filamento deve registrar o peso total de cada rolo, a quantidade usada em cada impressão e o custo por kg de cada compra. Com isso você sabe quanto material tem disponível e quando precisa repor. O Gestão3D tem um módulo de estoque de matéria-prima com alertas automáticos quando o filamento está abaixo do mínimo configurado."
  },
  {
    question: "Qual o melhor software para precificar impressão 3D?",
    answer: "O melhor software é aquele que considera todos os custos reais da sua operação, não só o filamento. O Gestão3D é o único que busca automaticamente a tarifa de energia da sua distribuidora local, calcula depreciação por modelo de impressora e ainda usa IA para sugerir a margem ideal por tipo de peça."
  },
  {
    question: "Como saber se estou tendo lucro com impressão 3D?",
    answer: "Você tem lucro quando o preço de venda cobre todos os custos (filamento, energia, manutenção, mão de obra) e ainda sobra margem. O erro mais comum é calcular só o custo do filamento e ignorar os outros. O Gestão3D registra o lucro real de cada venda e mostra seu resultado financeiro do mês no dashboard, sem planilha, sem achismo."
  }
];

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      <nav className="fixed top-0 w-full z-50 bg-[#0B1020]/80 backdrop-blur-md border-b border-white/5">
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
      <header className="relative min-h-[85vh] flex items-center pt-20 overflow-hidden bg-gradient-to-b from-[#0B1020] to-[#0f172a]">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-5 pointer-events-none"
          style={{ backgroundImage: `url(${printerBg})` }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1.22fr_1fr] gap-12 items-center">
            {/* Left Column: 55% approx */}
            <div className="text-left animate-in fade-in slide-in-from-left duration-700">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight text-white">
                Você sabe quantas horas imprimiu este mês.<br />
                <span className="text-[#00D4FF]">Mas sabe quanto lucrou de verdade?</span>
              </h1>
              <p className="text-lg text-gray-400 mt-4 max-w-lg leading-relaxed">
                A maioria dos impressores 3D cobra por grama e esquece a energia, a depreciação da máquina, as falhas e o tempo. O Gestão3D calcula tudo isso em segundos — e te mostra o preço certo para cada peça.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                <Link to="/signup">
                  <Button size="lg" className="h-14 px-8 text-lg font-bold bg-[#00D4FF] text-[#0B1020] hover:bg-[#00D4FF]/90 transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                    Calcular o custo da minha primeira peça — grátis
                  </Button>
                </Link>
                <a href="#demo">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium border-white/20 text-white bg-transparent hover:bg-white/5 transition-colors">
                    Ver como funciona
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column: 45% approx */}
            <div className="relative group animate-in fade-in slide-in-from-right duration-700 delay-200">
              <div className="absolute -inset-1 bg-[#00D4FF]/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="bg-[#00D4FF]/10 text-[#00D4FF] text-xs font-bold py-1.5 px-4 rounded-full flex items-center gap-2">
                    <span className="text-lg leading-none">✦</span>
                    Resultado ao vivo
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Custo Total</span>
                    <span className="text-white font-bold text-xl">R$ 11,69</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-y border-white/5">
                    <span className="text-gray-400 font-medium">Preço Sugerido</span>
                    <span className="text-[#00D4FF] text-3xl font-extrabold">R$ 29,90</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Lucro Líquido</span>
                    <span className="text-[#22C55E] font-bold text-xl">R$ 18,21 (150%)</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-gray-500 text-xs italic">
                    <span className="text-[#00D4FF] not-italic">✦</span>
                    IA sugere margem ideal para Bola Fidget
                  </div>
                </div>
              </div>

              {/* Decorative element */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#00D4FF]/10 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </header>


      {/* Trust/Social Proof Banner */}
      <section className="py-8 sm:py-10 bg-[#111827] border-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0 text-center">
            <div className="flex-1 space-y-1">
              <div className="text-3xl sm:text-4xl font-bold text-[#00D4FF]">+400</div>
              <div className="text-sm text-gray-400">impressores cadastrados</div>
            </div>
            
            <div className="hidden md:block w-px h-12 bg-white/10" />
            
            <div className="flex-1 space-y-1">
              <div className="text-3xl sm:text-4xl font-bold text-[#00D4FF]">+8.000</div>
              <div className="text-sm text-gray-400">orçamentos gerados</div>
            </div>
            
            <div className="hidden md:block w-px h-12 bg-white/10" />
            
            <div className="flex-1 space-y-1">
              <div className="text-3xl sm:text-4xl font-bold text-[#00D4FF]">33%</div>
              <div className="text-sm text-gray-400">economia na assinatura anual</div>
            </div>
          </div>
        </div>
      </section>


      {/* A Dor Section */}
      <section className="py-20 bg-[#0B1020]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">
              Se você se reconhece em alguma dessas situações, o Gestão3D foi feito para você
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Esses são os erros mais comuns de quem imprime sem controle financeiro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-[#111827] border border-white/10 border-t-4 border-t-[#EF4444] rounded-xl p-5 sm:p-6 flex flex-col h-full">
              <div className="mb-4">
                <TrendingDown className="w-6 h-6 sm:w-7 sm:h-7 text-[#EF4444]" />
              </div>
              <p className="italic text-white mb-3">
                "Eu calculo pelo peso do filamento, mas no final do mês não sobra quase nada."
              </p>
              <p className="text-gray-400 text-sm mt-auto">
                Você está ignorando energia, depreciação e mão de obra. O custo real pode ser 2x maior do que você pensa.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#111827] border border-white/10 border-t-4 border-t-[#F59E0B] rounded-xl p-5 sm:p-6 flex flex-col h-full">
              <div className="mb-4">
                <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-[#F59E0B]" />
              </div>
              <p className="italic text-white mb-3">
                "Já baixei o preço para fechar venda e fiquei na dúvida se ainda estava lucrando."
              </p>
              <p className="text-gray-400 text-sm mt-auto">
                Sem saber o custo exato, qualquer desconto pode virar prejuízo. Você precisa de um piso, não de um chute.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#111827] border border-white/10 border-t-4 border-t-[#00D4FF] rounded-xl p-5 sm:p-6 flex flex-col h-full">
              <div className="mb-4">
                <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-[#00D4FF]" />
              </div>
              <p className="italic text-white mb-3">
                "Tenho vários produtos mas não sei quais me dão mais retorno."
              </p>
              <p className="text-gray-400 text-sm mt-auto">
                Trabalhar muito não é o mesmo que trabalhar certo. Você precisa saber quais peças merecem o seu tempo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution (Now moved below "A Dor" or potentially merged/replaced) */}
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
            <div className="p-8 rounded-2xl border border-white/5 bg-[#111827] hover:border-[#00D4FF]/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Calculator className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Precificação Inteligente</h3>
              <p className="text-muted-foreground">Cálculo automático considerando filamento, energia, mão de obra e manutenção da máquina.</p>
            </div>
            
            <div className="p-8 rounded-2xl border border-white/5 bg-[#111827] hover:border-[#00D4FF]/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Package className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Controle de Estoque</h3>
              <p className="text-muted-foreground">Gerencie seus filamentos, cores e tipos de material. Saiba exatamente quando repor.</p>
            </div>
            
            <div className="p-8 rounded-2xl border border-white/5 bg-[#111827] hover:border-[#00D4FF]/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <LayoutDashboard className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Gestão de Pedidos</h3>
              <p className="text-muted-foreground">Organize suas encomendas e prazos em um dashboard intuitivo e profissional.</p>
            </div>
            
            <div className="p-8 rounded-2xl border border-[#7C3AED]/20 bg-[#111827] hover:border-[#7C3AED]/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#7C3AED] text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">IA</div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Brain className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">IA Sugere Margem <Badge variant="secondary" className="bg-ai text-white text-[10px]">IA</Badge></h3>
              <p className="text-muted-foreground">Nossa inteligência artificial analisa o cenário e sugere a melhor margem de lucro.</p>
            </div>
            
            <div className="p-8 rounded-2xl border border-white/5 bg-[#111827] hover:border-[#00D4FF]/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Zap className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Energia por Cidade</h3>
              <p className="text-muted-foreground">Busca automática das tarifas de energia atualizadas diretamente da sua distribuidora.</p>
            </div>
            
            <div className="p-8 rounded-2xl border border-white/5 bg-[#111827] hover:border-[#00D4FF]/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <CheckCircle2 className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Simulador de Lucro</h3>
              <p className="text-muted-foreground">Compare cenários de venda e descubra como aumentar sua rentabilidade em cada peça.</p>
            </div>
          </div>

          {/* Subseção: Veja o sistema em ação */}
          <div id="demo" className="mt-24 max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-10">Veja o sistema em ação</h3>
            
            <div className="flex overflow-x-auto pb-6 md:pb-0 md:grid md:grid-cols-3 gap-6 snap-x snap-mandatory scrollbar-hide">
              {[
                { 
                  title: "Precificação", 
                  subtitle: "IA calcula o preço ideal em segundos",
                  image: "https://ynvrijkuampxpsmshftm.supabase.co/storage/v1/object/public/prompt-images/uploads/1780409446027-18572e0f-b770-49aa-974b-dac75b535819.png"
                },
                { 
                  title: "Gestão de Caixa", 
                  subtitle: "Controle entradas, saídas e lucro",
                  image: "https://ynvrijkuampxpsmshftm.supabase.co/storage/v1/object/public/prompt-images/uploads/1780409045180-2a02dec9-c704-4b6d-9f1a-0f635e94e555.jpg"
                },
                { 
                  title: "Relatórios", 
                  subtitle: "Veja quais produtos mais lucram",
                  image: "https://ynvrijkuampxpsmshftm.supabase.co/storage/v1/object/public/prompt-images/uploads/1780409478534-0d943e2a-2c83-4351-bdcd-b15aaeae6a99.png"
                }
              ].map((card, i) => (
                <div key={i} className="min-w-[85vw] md:min-w-0 snap-center">
                  <div className="space-y-4">
                    <div 
                      className="aspect-video bg-[#111827] border border-white/10 rounded-xl shadow-lg overflow-hidden min-h-[220px] relative group cursor-pointer"
                      onClick={() => setSelectedImage(card.image)}
                    >
                      <img 
                        src={card.image} 
                        alt={card.title}
                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <p className="text-xs text-center text-gray-400">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
              <div 
                className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
                onClick={() => setSelectedImage(null)}
              >
                <button 
                  className="absolute top-6 right-6 text-white hover:text-primary transition-colors z-[101]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                  }}
                >
                  <X className="w-10 h-10" />
                </button>
                <img 
                  src={selectedImage} 
                  alt="Sistema em ação" 
                  className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
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
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">Para quem é o Gestão3D?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors group text-left">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Printer className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Makers e Hobbistas</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Você imprime por paixão mas quer transformar em renda. O Gestão3D te mostra exatamente quanto cobrar para não trabalhar de graça.</p>
            </div>
            
            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors group text-left">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Package className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Oficinas e Negócios 3D</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Você já vende, mas não sabe se está lucrando de verdade. O Gestão3D organiza seus custos, estoque e vendas em um só lugar.</p>
            </div>
            
            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors group text-left">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Tag className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lojas de Personalizados</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Você trabalha com volume e variedade. O Gestão3D controla cada peça, cada filamento e cada venda, sem planilha, sem achismo.</p>
            </div>
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

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-16 text-center">O que dizem os impressores que já usam o Gestão3D</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                text: "Antes eu precificava no chute e vivia no sufoco. Com o Gestão3D descobri que estava vendendo abaixo do custo. Em 2 semanas ajustei tudo e meu lucro aumentou.",
                name: "Rafael M.",
                city: "São Paulo, SP",
                initials: "RM"
              },
              {
                text: "A parte de energia por cidade foi o que me convenceu. Minha tarifa é diferente da média e isso fazia diferença no cálculo. Agora sei exatamente o que estou gastando.",
                name: "Camila T.",
                city: "Curitiba, PR",
                initials: "CT"
              },
              {
                text: "Simples, rápido e funciona. Uso todo dia antes de fechar qualquer orçamento. Não consigo mais trabalhar sem.",
                name: "Lucas A.",
                city: "Belo Horizonte, MG",
                initials: "LA"
              }
            ].map((testimonial, i) => (
              <div key={i} className="p-8 rounded-2xl bg-muted/20 border border-teal-500/10 flex flex-col h-full hover:border-teal-500/30 transition-colors">
                <div className="flex gap-1 mb-6 text-yellow-400">
                  {"⭐".repeat(5)}
                </div>
                
                <p className="italic text-muted-foreground mb-8 flex-grow">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {testimonial.initials}
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-muted-foreground">{testimonial.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="planos" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comece grátis. Escale quando quiser.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Sem cartão de crédito para começar. Cancele quando quiser.</p>
          </div>
          <PlansPage isEmbedded={true} />
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-20 border-t border-white/5 bg-[#0B1020]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para profissionalizar seu negócio 3D?</h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Junte-se a centenas de impressores que já estão lucrando mais com o Gestão3D.
          </p>
          <Link to="/signup">
            <Button size="lg" className="h-14 px-10 text-lg font-bold bg-primary text-[#0B1020] neon-glow">
              Criar Minha Conta Grátis
            </Button>
          </Link>
          <div className="mt-20 pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Gestão3D" className="h-6 object-contain grayscale opacity-50" />
              <span>© 2026 Gestão3D. Todos os direitos reservados.</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
              <Link to="/login" className="hover:text-primary transition-colors">Entrar</Link>
              <Link to="/signup" className="hover:text-primary transition-colors">Criar Conta Grátis</Link>
              <a href="#planos" className="hover:text-primary transition-colors">Planos</a>
              <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
