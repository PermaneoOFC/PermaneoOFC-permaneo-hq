import { test, expect } from "@playwright/test";

test("Virtual Floor 5.0 and all agent profiles hydrate without private requests", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [],
    privateRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    if (
      /\.supabase\.co|ai-gateway\.vercel\.sh|lovable\.dev|\/api\/agents|\/auth\/v1|\/rest\/v1/.test(
        request.url(),
      )
    )
      privateRequests.push(request.url());
  });
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ body: "", contentType: "text/css" }),
  );
  await page.goto("/escritorio");
  await expect(page.getByRole("group", { name: /Andar virtual do Permaneo/ })).toBeVisible();
  await page.screenshot({ path: "test-results/virtual-floor-5.png", fullPage: true });
  for (const slug of [
    "project-manager",
    "trello-scrum",
    "frontend",
    "backend",
    "devops",
    "qa-seguranca",
    "ui-ux",
    "marketing",
    "pitch",
    "documentarista",
    "pesquisa-dados",
    "educacional",
    "negocios",
    "financeiro",
  ]) {
    await page.goto(`/agentes/${slug}`);
    await expect(page.getByRole("button", { name: "Executar agente", exact: true })).toBeDisabled();
    await expect(page.getByRole("region", { name: "Conversa com o agente" })).toHaveCount(0);
  }
  await page.reload();
  await expect(page.getByRole("button", { name: "Executar agente", exact: true })).toBeDisabled();
  expect(privateRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("real API stays disabled in the demo runtime", async ({ request }) => {
  const response = await request.post("/api/agents/runs", {
    data: { agentSlug: "backend", prompt: "do not run" },
  });
  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ error: "REAL_BACKEND_DISABLED" });
});
