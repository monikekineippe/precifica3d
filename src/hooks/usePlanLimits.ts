import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function usePlanLimits() {
  const { user, isPro, isAnual } = useAuth();
  const [quotesThisMonth, setQuotesThisMonth] = useState(0);
  const [customPrintersCount, setCustomPrintersCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    supabase
      .from("orcamentos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth)
      .then(({ count }) => setQuotesThisMonth(count || 0));

    supabase
      .from("impressoras")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_precadastrada", false)
      .then(({ count }) => setCustomPrintersCount(count || 0));
  }, [user]);

  const canCreateQuote = isPro || quotesThisMonth < 2;
  const canCreatePrinter = isPro || customPrintersCount < 1;
  const canExport = isAnual;
  const canViewReports = isPro;
  const canViewFullHistory = isPro;

  const FREE_QUOTE_LIMIT = 2;
  const FREE_PRINTER_LIMIT = 1;

  return {
    quotesThisMonth,
    customPrintersCount,
    canCreateQuote,
    canCreatePrinter,
    canExport,
    canViewReports,
    canViewFullHistory,
    FREE_QUOTE_LIMIT,
    FREE_PRINTER_LIMIT,
    refresh: async () => {
      if (!user) return;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: qc } = await supabase.from("orcamentos").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startOfMonth);
      setQuotesThisMonth(qc || 0);
      const { count: pc } = await supabase.from("impressoras").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_precadastrada", false);
      setCustomPrintersCount(pc || 0);
    },
  };
}
