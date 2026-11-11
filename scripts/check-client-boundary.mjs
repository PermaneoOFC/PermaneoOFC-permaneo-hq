import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const vercelBuild = process.env["VERCEL"] === "1" || process.env["NITRO_PRESET"] === "vercel";
const root = path.resolve(vercelBuild ? ".vercel/output/static" : ".output/public");
const forbidden = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "AI_GATEWAY_API_KEY",
  "https://ai-gateway.vercel.sh",
  "ToolLoopAgent",
  "MockLanguageModelV3",
  "secret-provider-token",
  "brokeredPreviewStorage",
  "createLovableAuth",
];
let checked = 0;
for (const entry of await readdir(root, { recursive: true })) {
  if (!entry.endsWith(".js")) continue;
  const content = await readFile(path.join(root, entry), "utf8");
  const found = forbidden.filter(marker => content.includes(marker));
  if (found.length) throw new Error(`Server/test/legacy boundary violation in ${entry}: ${found.join(", ")}`);
  checked++;
}
if (!checked) throw new Error("No client bundles found to verify");
console.log(`Client boundary verified: ${checked} JavaScript bundles; no server credentials, AI runtime, test model or Lovable auth.`);
