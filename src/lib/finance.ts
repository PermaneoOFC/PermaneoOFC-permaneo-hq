export interface CostLine {
  monthly_cost: number;
  one_time_cost: number;
}
export interface Scenario {
  price_per_school: number;
  schools: number;
  churn_pct: number;
  growth_pct: number;
}

export function totalMonthly(items: CostLine[]) {
  return items.reduce((s, i) => s + (Number(i.monthly_cost) || 0), 0);
}
export function totalOneTime(items: CostLine[]) {
  return items.reduce((s, i) => s + (Number(i.one_time_cost) || 0), 0);
}
/** MRR = price per school × active schools */
export function mrr(s: Scenario) {
  return (Number(s.price_per_school) || 0) * (Number(s.schools) || 0);
}
/** Projects schools month by month: schools × (1 + growth − churn) */
export function projectSchools(s: Scenario, months: number) {
  const out: number[] = [];
  let n = Number(s.schools) || 0;
  const rate = ((Number(s.growth_pct) || 0) - (Number(s.churn_pct) || 0)) / 100;
  for (let m = 0; m < months; m++) {
    out.push(n);
    n = n * (1 + rate);
  }
  return out;
}
/** Schools needed to cover monthly costs; null when price is 0 */
export function breakEvenSchools(monthlyCost: number, price: number) {
  if (!price || price <= 0) return null;
  return Math.ceil(monthlyCost / price);
}
export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });