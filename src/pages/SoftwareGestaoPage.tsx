import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Calculator, Package, Wallet, ShoppingCart, BarChart3, History } from "lucide-react";

const SoftwareGestaoPage = () => {
  const features = [
    {
      title: "Precificação com IA",
      description: "Calcule o custo real de cada peça em segundos. O sistema considera filamento, energia com a tarifa real da sua distribuidora, depreciação da impressora, mão de obra e acessórios. A IA sugere a margem ideal por tipo de produto.",
      icon: <Calculator className="w-6 h-6 text-primary" />
    },
    {
      title: "Controle de Estoque",
      description: "Gerencie filamentos, embalagens e acessórios com custo médio ponderado, alertas de mínimo e baixa automática na venda. Ao lançar uma compra no caixa, o item entra no estoque automaticamente.",
      icon: <Package className="w-6 h-6 text-primary" />
    },
    {
      title: "Gestão de Caixa",
      description: "Registre vendas com canal de origem, forma de pagamento e lucro líquido real. Separe gastos operacionais de investimento em estoque. Veja faturamento, lucro e ticket médio do mês no dashboard.",
      icon: <Wallet className="w-6 h-6 text-primary" />
    },
    {
      title: "Preços para Marketplace",
      description: "Calcule o preço ideal para Shopee, Mercado Livre, Amazon e TikTok Shop com as taxas reais de cada plataforma. Nunca mais use o mesmo preço em todas as plataformas e perca margem sem perceber.",
      icon: <ShoppingCart className="w-6 h-6 text-primary" />
    },
    {
      title: "Relatórios e Análises",
      description: "Descubra quais produtos geram mais lucro, qual canal traz mais vendas e como sua margem evolui ao longo do tempo. Tome decisões com dados reais, não com estimativas.",
      icon: <BarChart3 className="w-6 h-6 text-primary" />
    },
    {
      title: "Histórico de Orçamentos",
      description: "Salve todos os seus orçamentos com custo, margem e preço sugerido. Use orçamentos anteriores como base para novos pedidos similares.",
      icon: <History className="w-6 h-6 text-primary" />
    }
  ];

  return (
    <>
      <Helmet>
        <title>Software de Gestão para Impressão 3D | Gestão3D</title>
        <meta name="description" content="O software completo para quem vende impressão 3D: precificação com IA, controle de estoque, gestão de vendas, relatórios e preços para marketplace. Grátis para começar." />
        <link rel="canonical" href="https://gestao3d.agenciaai.com.br/software-gestao-impressao-3d" />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
      
      {/* Basic Navigation Mock or Minimalist Header since separate Nav component is missing */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">Gestão3D</Link>
          <Link to="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-grow pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center text-primary leading-tight">
            Software de Gestão para Impressão 3D
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 text-center leading-relaxed">
            Gerenciar um negócio de impressão 3D exige mais do que uma calculadora ou uma planilha. 
            Você precisa de um sistema que conecte precificação, estoque, vendas, clientes e relatórios 
            em um só lugar, com dados reais da sua operação.
          </p>

          <h2 className="text-3xl font-bold mb-10 text-center text-foreground">O que o Gestão3D faz pelo seu negócio</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-2xl border bg-card/50 hover:bg-card transition-colors">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Para quem é o Gestão3D</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                O Gestão3D foi criado para impressores 3D que vendem peças por encomenda, em marketplaces 
                ou em feiras. Se você imprime para vender e quer saber exatamente quanto lucra em cada peça, 
                ou em feiras. Se você imprime para vender e quer saber exatamente quanto lucra em cada peça, o Gestão3D é para você.
              </p>
            </section>

            <section className="p-8 rounded-3xl bg-primary/5 border border-primary/10">
              <h2 className="text-3xl font-bold mb-6 text-foreground">Plano gratuito disponível</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Comece gratuitamente sem cartão de crédito. O plano gratuito inclui orçamentos ilimitados, 
                acesso às impressoras pré-cadastradas e cálculo em tempo real. Faça o primeiro orçamento 
                em menos de 2 minutos.
              </p>
              
              <div className="flex justify-center">
                <Link to="/register">
                  <Button size="lg" className="px-12 py-7 text-lg font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                    Começar gratuitamente
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 Gestão3D. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
    </>
  );
};

export default SoftwareGestaoPage;