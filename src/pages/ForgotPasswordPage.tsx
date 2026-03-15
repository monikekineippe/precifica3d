import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

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
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-foreground">Recuperar Senha</CardTitle>
          <p className="text-sm text-muted-foreground">
            {sent ? "Verifique seu e-mail" : "Insira seu e-mail para recuperar"}
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>.
              </p>
              <Link to="/login">
                <Button variant="outline" className="border-border">Voltar ao Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label className="text-foreground">E-mail</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-muted border-border" placeholder="seu@email.com" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Enviar Link"}
              </Button>
              <Link to="/login" className="block text-center text-sm text-primary hover:underline">
                Voltar ao Login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
