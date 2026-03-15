import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
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
      navigate("/login");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">PP</span>
            </div>
          </div>
          <CardTitle className="text-xl text-foreground">
            Print<span className="text-primary">Price</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Crie sua conta gratuita</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label className="text-foreground">Nome</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} required className="bg-muted border-border" placeholder="Seu nome" />
            </div>
            <div>
              <Label className="text-foreground">E-mail</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-muted border-border" placeholder="seu@email.com" />
            </div>
            <div>
              <Label className="text-foreground">Senha</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-muted border-border" placeholder="Mínimo 6 caracteres" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground neon-glow">
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Criar Conta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
