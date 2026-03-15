import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">P3</span>
            </div>
          </div>
          <CardTitle className="text-xl text-foreground">
            Precifica<span className="text-primary">3D</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Entre na sua conta</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-foreground">E-mail</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-muted border-border" placeholder="seu@email.com" />
            </div>
            <div>
              <Label className="text-foreground">Senha</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-muted border-border" placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground neon-glow">
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm space-y-1">
            <Link to="/forgot-password" className="text-primary hover:underline block">Esqueceu a senha?</Link>
            <p className="text-muted-foreground">
              Não tem conta? <Link to="/signup" className="text-primary hover:underline">Cadastre-se</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
