import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function usePlanLimits() {
  const { user, isPro, isAnual } = useAuth();
  const [calcsThisMonth, setCalcsThisMonth] = useState(0);
  const [customPrintersCount, setCustomPrintersCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    supabase
      .from("eventos_uso")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tipo", "calculo")
      .gte("created_at", startOfMonth)
      .then(({ count }) => setCalcsThisMonth(count || 0));

    supabase
      .from("impressoras")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_precadastrada", false)
      .then(({ count }) => setCustomPrintersCount(count || 0));
  }, [user]);

  const canCalculate = isPro || calcsThisMonth < 10;
  const canCreatePrinter = isPro || customPrintersCount < 1;
  const canExport = isAnual;
  const canViewReports = isPro;
  const canViewFullHistory = isPro;

  const FREE_CALC_LIMIT = 10;
  const FREE_PRINTER_LIMIT = 1;

  return {
    calcsThisMonth,
    customPrintersCount,
    canCalculate,
    canCreatePrinter,
    canExport,
    canViewReports,
    canViewFullHistory,
    FREE_CALC_LIMIT,
    FREE_PRINTER_LIMIT,
    refresh: async () => {
      if (!user) return;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: cc } = await supabase.from("eventos_uso").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("tipo", "calculo").gte("created_at", startOfMonth);
      setCalcsThisMonth(cc || 0);
      const { count: pc } = await supabase.from("impressoras").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_precadastrada", false);
      setCustomPrintersCount(pc || 0);
    },
  };
}
