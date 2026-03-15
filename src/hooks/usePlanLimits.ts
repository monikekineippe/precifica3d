import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function usePlanLimits() {
  const { user, isPro } = useAuth();
  const [quotesThisMonth, setQuotesThisMonth] = useState(0);
  const [customPrintersCount, setCustomPrintersCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    supabase
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth)
      .then(({ count }) => setQuotesThisMonth(count || 0));

    supabase
      .from("printers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_preset", false)
      .then(({ count }) => setCustomPrintersCount(count || 0));
  }, [user]);

  const canCreateQuote = isPro || quotesThisMonth < 2;
  const canCreatePrinter = isPro || customPrintersCount < 2;
  const canExport = isPro;
  const canViewReports = isPro;
  const canViewFullHistory = isPro;

  const FREE_QUOTE_LIMIT = 2;
  const FREE_PRINTER_LIMIT = 2;

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
      const { count: qc } = await supabase.from("quotes").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startOfMonth);
      setQuotesThisMonth(qc || 0);
      const { count: pc } = await supabase.from("printers").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_preset", false);
      setCustomPrintersCount(pc || 0);
    },
  };
}
