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
    answer: "Não. Se você consegue preencher uma ficha de pedido, consegue usar o Gestão3D. O controle de estoque é integrado à precificação e ao caixa, economizando seu tempo."
  },
  {
    question: "Vale R$ 29,90 por mês?",
    answer: "Se você evitar perder um único rolo de filamento por mês porque agora sabe exatamente o que tem em estoque, o sistema já se pagou. Além disso, a precificação correta baseada no custo médio aumenta seu lucro real."
  },
  {
    question: "E se eu não gostar?",
    answer: "Comece grátis, sem cartão de crédito. Teste todas as funcionalidades. Se não fizer sentido para o seu negócio, não assine. Simples assim."
  },
  {
    question: "Funciona para qualquer marca de filamento?",
    answer: "Sim. Você pode cadastrar qualquer marca, tipo (PLA, ABS, PETG, TPU, Resina) e cor. O sistema permite um controle total independente do fabricante."
  },
  {
    question: "Os dados ficam salvos?",
    answer: "Sim. Todo o seu histórico de compras, entradas e saídas de estoque fica salvo na sua conta, acessíveis de qualquer dispositivo a qualquer momento."
  }
];

const InventorySEOPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Helmet>
        <title>Controle de Estoque de Filamento para Impressão 3D | Gestão3D</title>
        <meta name="description" content="Gerencie seu estoque de filamento com alertas de mínimo, custo médio ponderado e baixa automática na venda. Grátis para começar." />
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
            Controle de Estoque de Filamento para Impressão 3D
          </h1>
          
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              Controlar o estoque de filamento vai além de saber quantos rolos você tem. Um controle eficiente registra o custo de cada compra, calcula o custo médio quando você compra o mesmo filamento por preços diferentes, avisa quando está perto de acabar e atualiza automaticamente quando você vende uma peça.
            </p>

            <h2 className="text-3xl font-bold mt-16 mb-8 text-white">
              O que o controle de estoque do Gestão3D oferece
            </h2>
            
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 list-none p-0">
              {[
                "Cadastro por tipo, marca, cor e peso",
                "Custo médio ponderado automático entre compras diferentes",
                "Alerta configurável de estoque mínimo por filamento",
                "Baixa automática do estoque ao registrar uma venda",
                "Entrada automática no estoque ao lançar uma compra no caixa",
                "Integração com a precificação: o custo real do filamento preenche automaticamente ao orçar"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-3xl font-bold mt-16 mb-6 text-white">
              Por que o custo médio ponderado importa
            </h2>
            <p className="text-gray-400 mb-12">
              Quando você compra 1kg de PLA por R$ 80 e depois mais 1kg por R$ 95, o custo real do seu estoque não é nem R$ 80 nem R$ 95 por kg. É a média ponderada: R$ 87,50 por kg. Usar o valor errado na precificação significa calcular a margem sobre um custo incorreto. O Gestão3D calcula automaticamente o custo médio ponderado a cada nova entrada no estoque.
            </p>

            <h2 className="text-3xl font-bold mt-16 mb-6 text-white">
              Como funciona a baixa automática de estoque
            </h2>
            <p className="text-gray-400 mb-12">
              Ao registrar uma venda no Gestão3D, você pode vincular o produto vendido a um item do estoque. O sistema desconta automaticamente a quantidade, mantendo o histórico sempre atualizado sem precisar de controle manual em paralelo.
            </p>

            <h2 className="text-3xl font-bold mt-16 mb-6 text-white">
              Alerta de estoque mínimo
            </h2>
            <p className="text-gray-400 mb-12">
              Configure a quantidade mínima de cada filamento. Quando o estoque cair abaixo desse limite, o sistema exibe um alerta no dashboard e no módulo de estoque. Você nunca mais vai começar uma impressão e descobrir no meio que o filamento acabou.
            </p>

            <div className="mt-16 text-center">
              <Link to="/register">
                <Button size="lg" className="h-14 px-10 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)] rounded-xl">
                  Controlar meu estoque grátis
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center text-white">Suas dúvidas sobre gestão de estoque</h2>
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

export default InventorySEOPage;