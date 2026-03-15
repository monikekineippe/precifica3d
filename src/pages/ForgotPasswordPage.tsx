import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Printer, ArrowLeft } from "lucide-react";

const BENEFITS = [
  "Cálculo automático de filamento, energia, mão de obra e manutenção",
  "Tarifa de energia por cidade, direto da distribuidora",
  "IA sugere a margem de lucro ideal para cada tipo de peça",
  "Simulador de cenários: conservador, sugerido e agressivo",
  "Suporte a impressoras mono e multifilamento (até 16 filamentos)",
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("E-mail de recuperação enviado!");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* LEFT COLUMN */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center neon-glow">
              <Printer size={24} className="text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-foreground">
              Precifica<span className="text-primary">3D</span>
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight">
              Precifique suas peças 3D com <span className="text-primary neon-text">inteligência</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Calcule o custo real de cada impressão e descubra o preço ideal de venda com ajuda da IA — em segundos.
            </p>
          </div>
          <ul className="space-y-3">
            {BENEFITS.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/80">{b}</span>
              </li>
            ))}
          </ul>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-xs text-primary font-medium">🇧🇷 Usado por impressores 3D em todo o Brasil</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 lg:hidden justify-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Printer size={20} className="text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              Precifica<span className="text-primary">3D</span>
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">Recuperar Senha</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {sent ? "Verifique seu e-mail" : "Insira seu e-mail para recuperar"}
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-foreground">
                  Enviamos um link de recuperação para{" "}
                  <strong className="text-primary">{email}</strong>.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Verifique seu e-mail para redefinir sua senha.
                </p>
              </div>
              <Link to="/login">
                <Button variant="outline" className="w-full border-border">
                  <ArrowLeft size={14} className="mr-2" /> Voltar ao Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
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
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground neon-glow"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>
              <Link
                to="/login"
                className="flex items-center justify-center gap-1 text-sm text-primary hover:underline"
              >
                <ArrowLeft size={14} /> Voltar ao Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
