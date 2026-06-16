import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  plano: "free" | "mensal" | "anual" | "master";
  plano_expiracao: string | null;
  primary_printer_id: string | null;
  greenn_assinatura_id: string | null;
  is_admin?: boolean;
  email?: string;
  instagram?: string;
  whatsapp?: string;
  telefone?: string;
  ultimo_acesso?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isPro: boolean;
  isAnual: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isPro: false,
  isAnual: false,
  isAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) {
      setProfile(data as Profile);
    }
  };

  const touchLastAccess = async (userId: string) => {
    try {
      await (supabase.from("profiles") as any)
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq("user_id", userId);
    } catch (e) {
      console.warn("Could not update ultimo_acesso", e);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          setTimeout(() => fetchProfile(currentUser.id), 0);
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            setTimeout(() => touchLastAccess(currentUser.id), 0);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
        touchLastAccess(currentUser.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAnual = (profile?.plano === "anual" || profile?.plano === "master") && (
    !profile.plano_expiracao || new Date(profile.plano_expiracao) > new Date()
  );

  const isPro = isAnual || (
    profile?.plano === "mensal" && (
      !profile.plano_expiracao || new Date(profile.plano_expiracao) > new Date()
    )
  );

  const isAdmin = profile?.is_admin === true;

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isPro, isAnual, isAdmin, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
