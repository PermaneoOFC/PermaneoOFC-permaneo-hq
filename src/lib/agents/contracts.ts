import { z } from "zod";

export const createRunInput = z
  .object({
    agentSlug: z.string().min(1).max(50),
    prompt: z.string().trim().min(1).max(4000),
    idempotencyKey: z.string().uuid(),
    requestId: z.string().uuid().optional(),
  })
  .strict();
export type CreateRunInput = z.infer<typeof createRunInput>;
export type RunStatus =
  "queued" | "running" | "awaiting_approval" | "completed" | "failed" | "cancelled";
export interface Run {
  id: string;
  user_id: string;
  agent_id: string;
  agent_slug: string;
  prompt: string;
  status: RunStatus;
  model: string;
  created_at: string;
  deadline_at: string;
  response: string;
  error_code: string | null;
  reserved_usd: number;
  input_price: number;
  output_price: number;
}
export interface Approval {
  id: string;
  run_id: string;
  user_id: string;
  agent_id: string;
  service: string;
  action: string;
  proposal: string;
  status: "pending" | "approved" | "rejected";
}
export interface RunDetail {
  run: Run;
  messages: { id: string; role: string; content: string }[];
  approvals: Approval[];
}
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
