import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Helmet } from 'react-helmet-async';
import logo from "@/assets/logo-precifica3d.png";
import PlansPage from "./PlansPage";

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

const CalculatorSEOPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Helmet>
        <title>Calculadora de Preço para Impressão 3D Grátis | Gestão3D</title>
        <meta name="description" content="Calcule o preço correto de qualquer impressão 3D gratuitamente. Nossa calculadora considera filamento, energia, depreciação, mão de obra e margem de lucro. Resultado em segundos." />
        <link rel="canonical" href="https://gestao3d.agenciaai.com.br/calculadora-preco-impressao-3d" />
      </Helmet>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0B1020]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/">
              <img src={logo} alt="Gestão3D" className="h-10 object-contain" />
            </Link>
            <span className="font-bold text-xl hidden sm:block">Gestão<span className="text-primary">3D</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/planos" className="text-sm font-medium hover:text-primary transition-colors">Planos</Link>
            <Link to="/login">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-primary text-primary-foreground">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-white leading-tight">
            Calculadora de Preço para Impressão 3D
          </h1>
          
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              Calcular o preço de uma impressão 3D vai muito além do custo do filamento. Uma calculadora completa precisa considerar energia elétrica, depreciação da impressora, manutenção, mão de obra e a margem de lucro adequada para o seu tipo de peça.
            </p>

            <h2 className="text-3xl font-bold mt-16 mb-8 text-white">
              O que a calculadora do Gestão3D calcula automaticamente
            </h2>
            
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 list-none p-0">
              {[
                "Custo do filamento com custo médio ponderado por kg",
                "Energia elétrica com a tarifa real da sua distribuidora por cidade",
                "Depreciação da impressora por hora de uso",
                "Manutenção e falhas estimadas por hora",
                "Mão de obra técnica com percentual configurável",
                "Margem de lucro sugerida pela IA por tipo de peça",
                "Embalagem e acessórios do seu estoque",
                "Taxas de marketplace (Shopee, Mercado Livre, Amazon, TikTok Shop)"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-3xl font-bold mt-16 mb-6 text-white">
              Por que calcular só o filamento é um erro
            </h2>
            <p className="text-gray-400 mb-12">
              A maioria dos impressores 3D calcula o preço multiplicando o peso da peça pelo custo por grama do filamento. Esse método ignora custos que podem representar mais da metade do custo real de produção. Uma impressora consome energia, deprecia com o uso, exige manutenção e o seu tempo tem valor. Quem não inclui esses custos vende com margem menor do que imagina, e muitas vezes no prejuízo.
            </p>

            <h2 className="text-3xl font-bold mt-16 mb-6 text-white">
              Como usar a calculadora de impressão 3D do Gestão3D
            </h2>
            <div className="space-y-6 mb-12">
              {[
                { step: 1, text: "Crie sua conta grátis e cadastre sua impressora com as especificações reais" },
                { step: 2, text: "Informe o tempo de impressão, o filamento usado e os acessórios da peça" },
                { step: 3, text: "Receba o custo total, o preço mínimo e o preço sugerido pela IA em segundos" }
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <p className="text-gray-300">{item.text}</p>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-bold mt-16 mb-6 text-white">
              Calculadora de preço para marketplace
            </h2>
            <p className="text-gray-400 mb-12">
              Além do preço de venda direto, o Gestão3D calcula automaticamente o preço ideal para cada marketplace. A Shopee cobra taxas diferentes do Mercado Livre, que cobra diferente da Amazon e do TikTok Shop. Usar o mesmo preço em todas as plataformas significa perder margem em alguma delas.
            </p>

            <div className="mt-16 text-center">
              <Link to="/register">
                <Button size="lg" className="h-14 px-10 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)] rounded-xl">
                  Acessar a calculadora grátis
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center text-white">Suas dúvidas antes de começar</h2>
          <div className="space-y-0">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className="border-b border-white/10">
                <button 
                  className="w-full py-5 text-left flex items-center justify-between hover:text-primary transition-colors group"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-bold text-white group-hover:text-primary transition-colors">{item.question}</span>
                  <ChevronDown className={`transition-transform duration-200 text-gray-500 ${openFaq === index ? "rotate-180 text-primary" : ""}`} />
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
      <section id="planos" className="py-20 bg-muted/30">
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

      {/* Footer */}
      <footer className="py-12 bg-[#0B1020] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <img src={logo} alt="Gestão3D" className="h-6 object-contain grayscale opacity-50" />
              <span>© 2026 Gestão3D. Todos os direitos reservados.</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2">
              <Link to="/login" className="hover:text-primary transition-colors">Entrar</Link>
              <Link to="/planos" className="hover:text-primary transition-colors">Planos</Link>
              <a href="#" className="hover:text-primary transition-colors">Termos</a>
              <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CalculatorSEOPage;