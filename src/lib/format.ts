export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export const formatCEP = (s: string) => {
  const d = onlyDigits(s).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export const formatPhone = (s: string) => {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
};

export const statusLabels: Record<string, string> = {
  analise_pagamento: "Análise de pagamento",
  pago: "Pago",
  em_producao: "Em produção",
  em_entrega: "Em fase de entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const statusColors: Record<string, string> = {
  analise_pagamento: "bg-warning text-warning-foreground",
  pago: "bg-primary text-primary-foreground",
  em_producao: "bg-accent text-accent-foreground",
  em_entrega: "bg-secondary text-secondary-foreground",
  entregue: "bg-success text-success-foreground",
  cancelado: "bg-destructive text-destructive-foreground",
};

export const STATUS_ORDER = [
  "analise_pagamento",
  "pago",
  "em_producao",
  "em_entrega",
  "entregue",
] as const;
