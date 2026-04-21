import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useConfig() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("configuracoes").select("chave, valor");
      const map: Record<string, string> = {};
      data?.forEach((c) => (map[c.chave] = c.valor || ""));
      setConfig(map);
      setLoading(false);
    })();
  }, []);

  return { config, loading };
}
