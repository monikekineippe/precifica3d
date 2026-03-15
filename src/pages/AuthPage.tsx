import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2 } from "lucide-react";
import printerBg from "@/assets/3d-printer-bg.png";
import logo from "@/assets/logo-precifica3d.png";

const BENEFITS = [
  "Cálculo automático de filamento, energia, mão de obra e manutenção",
  "Tarifa de energia por cidade, direto da distribuidora",
  "IA sugere a margem de lucro ideal para cada tipo de peça",
  "Simulador de cenários: conservador, sugerido e agressivo",
  "Suporte a impressoras mono e multifilamento (até 16 filamentos)",
];

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/");
      }
    } else {
      if (password.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome },
          emailRedirectTo: window.location.origin,
        },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
        setIsLogin(true);
        setPassword("");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* LEFT COLUMN — Product showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${printerBg})` }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-background" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative z-10 space-y-8">
          {/* Logo */}
          <div className="flex items-center">
            <img src={logo} alt="Precifica3D" className="h-16 xl:h-20 object-contain" />
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight">
              Precifique suas peças 3D com <span className="text-primary neon-text">inteligência</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Calcule o custo real de cada impressão e descubra o preço ideal de venda com ajuda da IA — em segundos.
            </p>
          </div>

          {/* Benefits */}
          <ul className="space-y-3">
            {BENEFITS.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/80">{b}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-xs text-primary font-medium">🇧🇷 Usado por impressores 3D em todo o Brasil</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm space-y-6">
      {/* Mobile hero block */}
          <div className="lg:hidden space-y-4 text-center mb-6">
            <div className="flex justify-center">
              <img src={logo} alt="Precifica3D" className="h-12 object-contain" />
            </div>
            <h2 className="text-xl font-bold text-foreground leading-tight">
              Precifique suas peças 3D com <span className="text-primary neon-text">inteligência</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Calcule custos e descubra o preço ideal de venda com IA
            </p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">🧮 Custo real</span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">⚡ Energia por cidade</span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">🤖 IA sugere margem</span>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                isLogin
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                !isLogin
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar conta
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label className="text-foreground">Nome</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required={!isLogin}
                  className="bg-muted border-border"
                  placeholder="Seu nome"
                />
              </div>
            )}
            <div>
              <Label className="text-foreground">E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-muted border-border"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <Label className="text-foreground">Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-muted border-border"
                placeholder={isLogin ? "••••••••" : "Mínimo 6 caracteres"}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground neon-glow"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar conta grátis"
              )}
            </Button>
          </form>

          {/* Footer links */}
          <div className="text-center text-sm space-y-2">
            {isLogin && (
              <Link
                to="/forgot-password"
                className="text-primary hover:underline block"
              >
                Esqueci minha senha
              </Link>
            )}
            {!isLogin && (
              <p className="text-muted-foreground text-xs">
                Plano gratuito. Sem cartão de crédito.
              </p>
            )}
            <Link
              to="/planos"
              className="text-primary hover:underline text-xs block"
            >
              Conheça os planos →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
