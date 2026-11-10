import { describe, expect, it } from "vitest";
import { breakEvenSchools, mrr, projectSchools, totalMonthly } from "./finance";

describe("finance", () => {
  it("defaults to zero when nothing is filled in", () => {
    expect(mrr({ price_per_school: 0, schools: 0, churn_pct: 0, growth_pct: 0 })).toBe(0);
    expect(totalMonthly([])).toBe(0);
  });
  it("MRR is price × schools", () => {
    expect(mrr({ price_per_school: 300, schools: 10, churn_pct: 0, growth_pct: 0 })).toBe(3000);
  });
  it("break-even is null without a price", () => {
    expect(breakEvenSchools(1000, 0)).toBeNull();
    expect(breakEvenSchools(1000, 300)).toBe(4);
  });
  it("projection applies growth minus churn", () => {
    const p = projectSchools({ price_per_school: 0, schools: 100, churn_pct: 5, growth_pct: 15 }, 2);
    expect(p[1]).toBeCloseTo(110);
  });
});