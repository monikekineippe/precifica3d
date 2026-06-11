import { Link } from "react-router-dom";
import PlansPage from "./PlansPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Calculator, Package, LayoutDashboard, Brain, Zap, 
  ArrowRight, ChevronDown, Printer, Box, Store, Tag, TrendingUp, 
  Wallet, ShoppingCart, Circle, ZoomIn, X, TrendingDown, 
  AlertTriangle, HelpCircle, ClipboardList, Cpu, Sparkles,
  ShoppingBag,
  ArrowDownToLine
} from "lucide-react";
import logo from "@/assets/logo-precifica3d.png";
import printerBg from "@/assets/3d-printer-bg.png";
import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "É complicado de usar?",
    answer: "Não. Se você consegue preencher uma ficha de pedido, consegue usar o Gestão3D. O cálculo completo leva menos de 2 minutos na primeira vez. Depois disso, menos de 30 segundos por peça."
  },
  {
    question: "Vale R$ 29,90 por mês?",
    answer: "Depende. Se você vende pelo menos 5 peças por mês e cobra R$ 5 a mais em cada uma porque agora sabe o custo real, o sistema já se pagou. A maioria dos usuários recupera o investimento na primeira semana."
  },
  {
    question: "E se eu não gostar?",
    answer: "Comece grátis, sem cartão de crédito. Teste com 2 orçamentos reais. Se não fizer sentido para o seu negócio, não assine. Simples assim."
  },
  {
    question: "Funciona para qualquer impressora?",
    answer: "Sim. O sistema tem impressoras pré-cadastradas das marcas mais usadas no Brasil Bambu Lab, Creality, Prusa, FLSUN e outras. Você também pode cadastrar a sua com as especificações exatas."
  },
  {
    question: "Os dados ficam salvos?",
    answer: "Sim. Todos os seus orçamentos, vendas e histórico ficam salvos na sua conta, acessíveis de qualquer dispositivo a qualquer momento."
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
            <Link to="/blog" className="text-sm font-medium hover:text-primary transition-colors">Blog</Link>
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
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight text-white">
                Você está vendendo impressão 3D.<br />
                <span className="text-[#00D4FF]">Mas está lucrando de verdade?</span>
              </h1>
              <p className="text-lg text-gray-400 mt-4 max-w-lg leading-relaxed">
                A maioria dos impressores descobre tarde demais que estava vendendo no prejuízo. O Gestão3D mostra o lucro real de cada peça antes, durante e depois da venda, com os custos que você estava esquecendo.
              </p>
              <div className="flex flex-col gap-3 mt-8 w-full max-w-md">
                <a href="/signup" className="w-full text-center bg-[#00D4FF] text-[#0B1020] 
                  font-bold rounded-xl py-4 px-6 text-sm sm:text-base hover:opacity-90 
                  transition-opacity">
                  Calcular o custo da minha primeira peça grátis
                </a>
                <a href="#demo" className="w-full text-center border border-white/20 
                  text-white rounded-xl py-4 px-6 text-sm sm:text-base hover:bg-white/5 
                  transition-colors">
                  Ver como funciona
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
      <section className="pt-20 pb-16 bg-[#0B1020]">
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

      {/* Comparison Section */}
      <section className="py-24 bg-[#0f172a]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-2">Por que planilha não resolve</h2>
            <p className="text-gray-400">Planilha calcula. O Gestão3D mostra o lucro real.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-gray-400 bg-transparent">O que você precisa saber</th>
                  <th className="p-4 text-center text-sm font-bold text-[#EF4444] bg-[#111827] border-t border-x border-white/5 rounded-t-xl">
                    <div className="flex flex-col items-center gap-2">
                      <X className="w-5 h-5" />
                      Planilha / Calculadora
                    </div>
                  </th>
                  <th className="p-4 text-center text-sm font-bold text-[#00D4FF] bg-[#00D4FF]/5 border-t border-x border-[#00D4FF]/20 rounded-t-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#00D4FF]" />
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Gestão3D
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  "Cálculo de custo de filamento (gramas)",
                  "Cálculo de custo de energia por tempo",
                  "Custo real do filamento (Média Ponderada)",
                  "Tarifa de energia real por cidade/distribuidora",
                  "Depreciação e manutenção da impressora por hora",
                  "Preço ideal por marketplace (Shopee, ML, etc)",
                  "Gestão de estoque com alerta de nível crítico",
                  "Baixa automática do estoque ao registrar venda",
                  "Lucro real por peça (Snapshot Financeiro)",
                  "Acompanhamento de Caixa (Entradas e Saídas)",
                  "Relatórios e Dashboard de Desempenho Real",
                  "IA sugerindo margem por tipo de produto",
                  "Exportação de dados em PDF e CSV",
                ].map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"}>
                    <td className="p-4 text-white/80 border-b border-white/5">{item}</td>
                    <td className="p-4 text-center border-b border-x border-white/5 bg-[#111827]/50">
                      {idx < 2 ? <CheckCircle2 className="w-5 h-5 text-[#22C55E] mx-auto" /> : <X className="w-5 h-5 text-[#EF4444] mx-auto" />}
                    </td>
                    <td className="p-4 text-center border-b border-x border-[#00D4FF]/10 bg-[#00D4FF]/5">
                      <CheckCircle2 className="w-5 h-5 text-[#22C55E] mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-16 text-center">
            <p className="text-xl text-white font-medium mb-6">Chega de adivinhar. Comece a saber.</p>
            <Link to="/signup">
              <Button size="lg" className="h-14 px-10 text-base font-bold bg-[#00D4FF] text-[#0B1020] hover:bg-[#00D4FF]/90 transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)] rounded-xl">
                Criar conta grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-[#0f172a] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-2">
              Veja o que acontece quando você usa o Gestão3D
            </h2>
            <p className="text-gray-400">
              Do zero ao preço certo em menos de 2 minutos
            </p>
          </div>

          <div className="relative">
            {/* Desktop Connector Line */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              {/* Step 1 */}
              <div className="relative group text-center md:text-left pl-12 md:pl-0 border-l-2 border-dashed border-white/10 md:border-l-0">
                <div className="absolute top-0 -left-[13px] md:relative md:left-0 md:mb-6">
                  <div className="relative inline-flex items-center justify-center">
                    <span className="absolute -top-4 -left-2 text-5xl font-bold text-[#00D4FF]/10 select-none">01</span>
                    <div className="w-14 h-14 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] relative z-10 border border-[#00D4FF]/20 shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                      <ClipboardList className="w-8 h-8" />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">Informe os dados da impressão</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Nome da peça, impressora, tempo de impressão e filamento usado. Leva menos de 1 minuto.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative group text-center md:text-left pl-12 md:pl-0 border-l-2 border-dashed border-white/10 md:border-l-0">
                <div className="absolute top-0 -left-[13px] md:relative md:left-0 md:mb-6">
                  <div className="relative inline-flex items-center justify-center">
                    <span className="absolute -top-4 -left-2 text-5xl font-bold text-[#00D4FF]/10 select-none">02</span>
                    <div className="w-14 h-14 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] relative z-10 border border-[#00D4FF]/20 shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                      <Cpu className="w-8 h-8" />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">O sistema calcula tudo automaticamente</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Filamento, energia com a tarifa real da sua distribuidora, mão de obra, manutenção e depreciação. Sem estimativa, sem chute.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative group text-center md:text-left pl-12 md:pl-0">
                <div className="absolute top-0 -left-[13px] md:relative md:left-0 md:mb-6">
                  <div className="relative inline-flex items-center justify-center">
                    <span className="absolute -top-4 -left-2 text-5xl font-bold text-[#7C3AED]/10 select-none">03</span>
                    <div className="w-14 h-14 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] relative z-10 border border-[#7C3AED]/20 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
                      <Sparkles className="w-8 h-8" />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">A IA sugere a margem ideal</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Baseada no tipo de peça e no mercado, a IA indica a margem certa e mostra o preço sugerido, o preço mínimo e o lucro líquido por unidade.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link to="/signup" className="inline-block w-full sm:w-auto">
              <Button size="lg" className="h-14 w-full sm:w-auto px-8 text-sm sm:text-base font-bold bg-[#00D4FF] text-[#0B1020] hover:bg-[#00D4FF]/90 transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)] rounded-xl">
                Quero calcular minha primeira peça agora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 bg-[#0B1020]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div id="demo" className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold text-center text-white mb-2">Não é uma planilha. É uma plataforma completa.</h3>
            <p className="text-gray-400 text-center mb-12">Veja como o Gestão3D funciona na prática clique nas imagens para ampliar.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  title: "Selecione filamento, embalagem e acessórios direto do estoque",
                  image: "https://ynvrijkuampxpsmshftm.supabase.co/storage/v1/object/public/prompt-images/uploads/1780616190336-0f4c3e6a-3270-4f95-ad2b-1934741785db.png"
                },
                { 
                  title: "Controle cada venda, custo e lucro em tempo real",
                  image: "https://ynvrijkuampxpsmshftm.supabase.co/storage/v1/object/public/prompt-images/uploads/1780616212786-2248f4a4-1e56-43c1-acb0-334479d09c0f.png"
                },
                { 
                  title: "Descubra quais produtos merecem o seu tempo",
                  image: "https://ynvrijkuampxpsmshftm.supabase.co/storage/v1/object/public/prompt-images/uploads/1780616255664-1219cf17-b1ad-4869-9be1-8d83ac3575e6.png"
                }
              ].map((card, i) => (
                <div key={i} className="flex flex-col space-y-4">
                  <div 
                    className="aspect-video bg-[#111827] border border-white/10 rounded-xl shadow-lg overflow-hidden min-h-[200px] md:min-h-[280px] relative group cursor-pointer"
                    onClick={() => setSelectedImage(card.image)}
                  >
                    <img 
                      src={card.image} 
                      alt={card.title}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-10 h-10 text-[#00D4FF]" />
                    </div>
                  </div>
                  <p className="text-xs text-center text-gray-400">
                    {card.title}
                  </p>
                </div>
              ))}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
              <div 
                className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
                onClick={() => setSelectedImage(null)}
              >
                <button 
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white hover:text-[#00D4FF] transition-colors z-[101] bg-black/50 rounded-full p-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                  }}
                >
                  <X className="w-8 h-8 sm:w-10 sm:h-10" />
                </button>
                <img 
                  src={selectedImage} 
                  alt="Sistema em ação ampliado" 
                  className="max-w-full md:max-w-5xl max-h-[85vh] md:max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Diferenciais Section */}
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">
              O que nenhuma outra ferramenta faz
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Esses são os motivos pelos quais impressores trocam planilhas e calculadoras pelo Gestão3D.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Diferencial 1 */}
            <div className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col h-full hover:border-[#00D4FF]/30 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mb-6 group-hover:bg-[#00D4FF]/20 transition-colors">
                <Zap className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Tarifa de energia real por cidade</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Não usamos uma média genérica. O Gestão3D busca automaticamente a tarifa da sua distribuidora de energia por cidade. Se você está em Curitiba, paga diferente de quem está em São Paulo e isso muda o seu custo real.
              </p>
            </div>

            {/* Diferencial 2 */}
            <div className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col h-full hover:border-[#7C3AED]/30 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mb-6 group-hover:bg-[#7C3AED]/20 transition-colors">
                <Sparkles className="w-6 h-6 text-[#7C3AED]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">IA com contexto de produto</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                A margem sugerida varia por tipo de peça. Bola fidget tem potencial de margem diferente de peça técnica industrial. A IA sabe disso e ajusta a sugestão para cada orçamento.
              </p>
            </div>

            {/* Diferencial 3 */}
            <div className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col h-full hover:border-[#22C55E]/30 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-[#22C55E]/10 flex items-center justify-center mb-6 group-hover:bg-[#22C55E]/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-[#22C55E]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Lucro real, não estimado</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Cada venda salva um snapshot financeiro imutável: custo no momento da venda, taxa do pagamento, desconto aplicado e lucro líquido real. Não uma projeção o número verdadeiro.
              </p>
            </div>

            {/* Diferencial 4 */}
            <div className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col h-full hover:border-[#00D4FF]/30 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mb-6 group-hover:bg-[#00D4FF]/20 transition-colors">
                <Store className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Calculadora de marketplace integrada</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Informe o custo da peça e veja em segundos o preço ideal para cada plataforma com a taxa real da Shopee, Mercado Livre, Amazon e TikTok Shop já descontada. Sem planilha, sem chute.
              </p>
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
      <section className="py-20 bg-[#0B1020]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-2">
              Para quem quer parar de adivinhar e começar a lucrar
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col h-full group hover:border-[#00D4FF]/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mb-6 group-hover:bg-[#00D4FF]/20 transition-colors">
                <Printer className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Makers que querem profissionalizar</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Você imprime com qualidade mas ainda precifica no instinto. O Gestão3D te dá os números para cobrar com confiança e transformar hobby em renda.
              </p>
            </div>
            
            <div className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col h-full group hover:border-[#00D4FF]/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mb-6 group-hover:bg-[#00D4FF]/20 transition-colors">
                <Package className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Oficinas com volume de pedidos</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Você já vende, mas não sabe exatamente o que está lucrando em cada produto. O Gestão3D organiza tudo: custos, estoque, vendas e relatórios em um só lugar.
              </p>
            </div>
            
            <div className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col h-full group hover:border-[#00D4FF]/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mb-6 group-hover:bg-[#00D4FF]/20 transition-colors">
                <Tag className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Lojas de personalizados e presentes</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Você trabalha com variedade e precisa de agilidade. O Gestão3D deixa você precificar qualquer peça em segundos e saber na hora se o pedido vale a pena.
              </p>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col h-full group hover:border-[#00D4FF]/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mb-6 group-hover:bg-[#00D4FF]/20 transition-colors">
                <ShoppingBag className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Preços para Marketplace</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Saiba exatamente quanto cobrar na Shopee, Mercado Livre, Amazon e TikTok Shop. A IA calcula o preço ideal já com as taxas de cada plataforma.
              </p>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col h-full group hover:border-[#00D4FF]/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mb-6 group-hover:bg-[#00D4FF]/20 transition-colors">
                <Package className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Estoque integrado à precificação</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Selecione o filamento, embalagem e acessórios direto do seu estoque na hora de precificar. O custo real preenche automaticamente.
              </p>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col h-full group hover:border-[#00D4FF]/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mb-6 group-hover:bg-[#00D4FF]/20 transition-colors">
                <ArrowDownToLine className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Compra vira estoque automaticamente</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Ao lançar uma compra de insumo no caixa, o item entra no estoque na mesma hora. Sem precisar cadastrar duas vezes.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Testimonials Section */}
      <section className="py-20 bg-[#111827]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center text-white">O que dizem os impressores que pararam de trabalhar no prejuízo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <div key={i} className="p-6 rounded-xl bg-[#1F2937] border border-white/10 flex flex-col h-full hover:border-[#00D4FF]/30 transition-colors">
                <div className="flex gap-1 mb-4 text-[#F59E0B]">
                  {"★".repeat(5)}
                </div>
                
                <p className="italic text-gray-300 mb-8 flex-grow">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF] font-bold shrink-0">
                    {testimonial.initials}
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-white">{testimonial.name}</div>
                    <div className="text-gray-500">{testimonial.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center text-white">Suas dúvidas antes de começar</h2>
          <div className="space-y-0">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className="border-b border-white/10">
                <button 
                  className="w-full py-5 text-left flex items-center justify-between hover:text-[#00D4FF] transition-colors group"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-bold text-white group-hover:text-[#00D4FF] transition-colors">{item.question}</span>
                  <ChevronDown className={`transition-transform duration-200 text-gray-500 ${openFaq === index ? "rotate-180 text-[#00D4FF]" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? "max-h-96 pb-5" : "max-h-0"}`}>
                  <p className="text-gray-400 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Plans Section */}
      <section id="planos" className="py-20 bg-muted/30 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Comece grátis. Escale quando quiser.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Sem cartão de crédito para começar. Cancele quando quiser.</p>
          </div>
          <div className="w-full">
            <PlansPage isEmbedded={true} />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-b from-[#0B1020] to-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Você vai continuar no prejuízo sem saber?</h2>
          <p className="text-lg sm:text-xl text-gray-400 mt-4 max-w-2xl mx-auto">
            Ou prefere saber exatamente quanto lucra em cada peça, antes de baixar o preço, antes de aceitar o pedido e antes de comprar mais filamento?
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 max-w-md mx-auto">
            <Link to="/signup" className="w-full">
              <Button size="lg" className="w-full h-14 px-8 text-base sm:text-lg font-bold bg-[#00D4FF] text-[#0B1020] hover:bg-[#00D4FF]/90 transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)] rounded-xl whitespace-nowrap">
                Criar minha conta grátis agora
              </Button>
            </Link>
          </div>
          <p className="text-gray-500 text-sm mt-6">
            Sem cartão de crédito · Cancele quando quiser · Leva 30 segundos
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#0B1020] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <img src={logo} alt="Gestão3D" className="h-6 object-contain grayscale opacity-50" />
            <span>© 2026 Gestão3D. Todos os direitos reservados.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2">
            <Link to="/login" className="hover:text-[#00D4FF] transition-colors">Entrar</Link>
            <a href="#planos" className="hover:text-[#00D4FF] transition-colors">Planos</a>
            <a href="#" className="hover:text-[#00D4FF] transition-colors">Termos</a>
            <a href="#" className="hover:text-[#00D4FF] transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
