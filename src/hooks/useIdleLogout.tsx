import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Desloga automaticamente após `timeoutMs` de inatividade (sem mouse/teclado/touch).
 * Default: 2 horas.
 */
export function useIdleLogout(timeoutMs: number = 2 * 60 * 60 * 1000) {
  const { signOut, user } = useAuth();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const reset = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(async () => {
        toast.info("Sessão expirada por inatividade. Faça login novamente.");
        await signOut();
      }, timeoutMs);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user, timeoutMs, signOut]);
}
