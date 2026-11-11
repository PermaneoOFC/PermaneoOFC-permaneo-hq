import { describe, expect, it } from "vitest";
import { demoAgents } from "@/lib/demo";

describe("read-only demo data", () => {
  it("contains the 14 agents across the existing rooms with no active status", () => {
    expect(demoAgents).toHaveLength(14);
    expect(new Set(demoAgents.map((agent) => agent.room))).toEqual(
      new Set(["coordenacao", "engenharia", "estudio", "biblioteca", "negocios"]),
    );
    expect(demoAgents.every((agent) => agent.status === "nao_configurado")).toBe(true);
  });

  it("keeps local demo identifiers separate from database UUIDs", () => {
    expect(demoAgents.every((agent) => agent.id.startsWith("demo-"))).toBe(true);
    expect(demoAgents.map((agent) => agent.slug)).toEqual([
      "project-manager", "trello-scrum", "frontend", "backend", "devops", "qa-seguranca",
      "ui-ux", "marketing", "pitch", "documentarista", "pesquisa-dados", "educacional",
      "negocios", "financeiro",
    ]);
  });
});
