import {
  Instagram,
  Linkedin,
  Youtube,
  MessageCircle,
  ClipboardList,
  BookOpen,
  Sparkles,
  Users,
  Bot,
  Gem,
} from "lucide-react";
import { motion } from "framer-motion";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 20 };

const SectionLabel = ({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) => (
  <div className="flex justify-center mb-6">
    <span
      className={`text-[10px] tracking-[0.2em] font-bold uppercase px-3 py-1 border rounded-full ${
        light
          ? "border-white/20 text-white/80"
          : "border-foreground/10 text-primary"
      }`}
    >
      {children}
    </span>
  </div>
);

const SocialIcon = ({
  Icon,
  href,
}: {
  Icon: React.ElementType;
  href: string;
}) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ y: -2 }}
    className="p-2 text-muted-foreground hover:text-primary transition-colors"
  >
    <Icon size={20} />
  </motion.a>
);

const LinkCard = ({
  children,
  className = "",
  dark = false,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -4 }}
    transition={SPRING}
    className={`p-6 rounded-lg border transition-shadow hover:shadow-xl ${
      dark
        ? "bg-[hsl(0_0%_15%)] border-white/10 text-white"
        : "bg-card border-foreground/[0.05] text-card-foreground"
    } ${className}`}
  >
    {children}
  </motion.div>
);

const LinkButton = ({
  href,
  variant = "outline",
  children,
}: {
  href: string;
  variant?: "outline" | "solidGold" | "rose" | "outlineWhite";
  children: React.ReactNode;
}) => {
  const base =
    "flex items-center justify-center gap-2 py-4 px-6 rounded-md font-bold text-xs tracking-widest uppercase transition-all duration-300 w-full";

  const styles = {
    outline: "border border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    solidGold:
      "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20",
    rose: "bg-secondary text-secondary-foreground hover:brightness-105",
    outlineWhite:
      "border border-white/30 text-white hover:bg-white hover:text-deep-black",
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileTap={{ scale: 0.98 }}
      className={`${base} ${styles[variant]}`}
    >
      {children}
    </motion.a>
  );
};

export default function Index() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      <main className="max-w-[480px] mx-auto pb-20">
        {/* PROFILE */}
        <header className="pt-16 pb-12 px-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full p-[3px] bg-gradient-to-tr from-primary to-secondary"
          >
            <div className="w-full h-full rounded-full bg-deep-black flex items-center justify-center border-4 border-background">
              <span className="text-primary font-serif text-2xl tracking-tighter">
                MK
              </span>
            </div>
          </motion.div>

          <h1 className="font-serif text-3xl mb-2 tracking-tight">
            Monike Kineippe
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto mb-6">
            Empresária · Mentora · CEO de 3 CNPJs
            <br />
            <span className="text-primary">
              Especialista em negócios femininos
            </span>
          </p>

          <div className="flex justify-center gap-2">
            <SocialIcon
              Icon={Instagram}
              href="https://instagram.com/monikekineippe"
            />
            <SocialIcon
              Icon={Linkedin}
              href="https://www.linkedin.com/in/monikekineippe/"
            />
            <SocialIcon
              Icon={Youtube}
              href="https://www.youtube.com/@monikekineippe"
            />
            <SocialIcon Icon={MessageCircle} href="https://wa.link/7ucy3t" />
          </div>
        </header>

        {/* SEPARATOR */}
        <div className="flex items-center gap-4 px-10 mb-12">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/30" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-medium">
            ✦ Escolha sua etapa ✦
          </span>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/30" />
        </div>

        {/* SECTION 1 — FREE */}
        <section className="px-6 space-y-4 mb-12">
          <SectionLabel>Comece Aqui · Grátis</SectionLabel>

          <LinkCard>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-green-50 text-green-600">
                <MessageCircle size={24} />
              </div>
              <h3 className="font-serif text-xl">Canal Empresária 4.0</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Conteúdo gratuito sobre negócios femininos direto no WhatsApp. Sem
              custo, sem compromisso.
            </p>
            <LinkButton href="https://chat.whatsapp.com/GKEqYxylMMHKSJxIsST4IZ">
              Entrar no Canal Gratuito
            </LinkButton>
          </LinkCard>

          <LinkCard>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <ClipboardList size={24} />
              </div>
              <h3 className="font-serif text-xl">Diagnóstico do Negócio</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Responda algumas perguntas e descubra o que está travando o
              crescimento do seu negócio agora.
            </p>
            <LinkButton href="https://form.respondi.app/xedxJc0y">
              Fazer meu Diagnóstico
            </LinkButton>
          </LinkCard>
        </section>

        {/* SECTION 2 — ENTRY PRODUCTS */}
        <section className="px-6 py-12 bg-card space-y-4 mb-12">
          <SectionLabel>Primeiros Passos</SectionLabel>

          <LinkCard className="bg-background border-none">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-card text-secondary">
                <BookOpen size={24} />
              </div>
              <h3 className="font-serif text-xl">
                Ebook — Estratégia Feminina
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Material prático para você dar o primeiro passo com clareza e
              estratégia empresarial.
            </p>
            <LinkButton
              variant="rose"
              href="https://mika.monikekineippe.com.br/ebook"
            >
              Quero o Ebook
            </LinkButton>
          </LinkCard>

          <LinkCard className="bg-background border-none">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-card text-primary">
                <Sparkles size={24} />
              </div>
              <h3 className="font-serif text-xl">Sessão MIKA</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Uma sessão personalizada onde a MIKA analisa seu negócio e aponta o
              caminho mais rápido.
            </p>
            <LinkButton
              variant="rose"
              href="https://mika.monikekineippe.com.br/sessao"
            >
              Agendar minha Sessão
            </LinkButton>
          </LinkCard>
        </section>

        {/* SECTION 3 — CORE PRODUCTS */}
        <section className="px-6 py-12 bg-deep-black space-y-6">
          <SectionLabel light>Soluções Completas</SectionLabel>

          <LinkCard
            dark
            className="border-primary/40 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-bold px-3 py-1 rounded-bl-lg tracking-tighter">
              MAIS POPULAR
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-white/5 text-primary">
                <Users size={24} />
              </div>
              <h3 className="font-serif text-xl">
                Comunidade Empresária 4.0
              </h3>
            </div>
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
              Método, suporte ao vivo e rede de empresárias. +15 cursos, hotseat
              semanal e masterclass mensal.
            </p>
            <div className="mb-6">
              <span className="text-[10px] text-neutral-500 block mb-1 uppercase tracking-widest">
                Investimento
              </span>
              <p className="text-primary font-serif text-lg">
                12x de R$ 49,70
              </p>
            </div>
            <LinkButton
              variant="solidGold"
              href="https://payfast.greenn.com.br/49322"
            >
              Quero entrar na Comunidade
            </LinkButton>
          </LinkCard>

          <LinkCard dark>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-white/5 text-primary">
                <Bot size={24} />
              </div>
              <h3 className="font-serif text-xl">
                Corujah — IA para Infoprodutos
              </h3>
            </div>
            <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
              A IA que constrói infoprodutos completos para você começar a vender
              do absoluto zero.
            </p>
            <LinkButton
              variant="outlineWhite"
              href="https://corujah.metodomulhernopoder.com.br/"
            >
              Conhecer o Corujah
            </LinkButton>
          </LinkCard>
        </section>

        {/* SECTION 4 — MENTORSHIP */}
        <section className="px-6 py-16 bg-gradient-to-b from-deep-black to-[#2A1A0A]">
          <SectionLabel light>Aceleração · Nível Avançado</SectionLabel>

          <LinkCard
            dark
            className="bg-gradient-to-br from-[hsl(0_0%_16%)] to-[hsl(0_0%_10%)] border-primary shadow-2xl shadow-primary/10"
          >
            <div className="text-center mb-8">
              <Gem className="mx-auto mb-4 text-primary" size={40} />
              <h3 className="font-serif text-3xl mb-1">
                Lapidando Diamantes
              </h3>
              <p className="text-primary text-[10px] tracking-[0.2em] uppercase font-bold">
                Mentoria em Grupo · Vagas Limitadas
              </p>
            </div>

            <p className="text-center text-sm text-neutral-300 mb-8 leading-relaxed">
              Para a empresária que já tem negócio e quer acelerar resultados com
              mentoria real e acompanhamento próximo de Monike Kineippe.
            </p>

            <LinkButton
              variant="solidGold"
              href="https://wa.me/+5511972313181?text=Quero%20saber%20mais%20da%20sua%20mentoria%20Lapidando%20Diamante%24"
            >
              Quero saber mais
            </LinkButton>

            <p className="text-center text-[10px] text-primary/60 mt-4 italic">
              Você será direcionada para conversar com nosso time.
            </p>
          </LinkCard>
        </section>

        {/* FOOTER */}
        <footer className="bg-deep-black pt-12 pb-20 px-6 text-center">
          <div className="w-12 h-[1px] bg-primary mx-auto mb-8 opacity-50" />
          <p className="text-[10px] text-neutral-500 tracking-widest uppercase mb-2">
            © 2025 Monike Kineippe · Todos os direitos reservados
          </p>
          <p className="text-[10px] text-neutral-600">
            monikekineippe.com.br
          </p>
        </footer>
      </main>
    </div>
  );
}
