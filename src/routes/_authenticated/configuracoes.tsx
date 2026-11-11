import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/hq/ui";
import { TeamAccessPanel } from "@/components/hq/TeamAccessPanel";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Permaneo HQ" },
      { name: "description", content: "Gerencie o acesso e as permissões dos integrantes do Permaneo HQ." },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Configurações"
        description="Acompanhe os novos cadastros e autorize cada integrante com o nível de acesso correto."
      />
      <TeamAccessPanel />
    </>
  );
}
