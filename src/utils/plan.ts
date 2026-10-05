import type { Account } from "../api/client";

export const MODEL_LABELS: Record<string, string> = {
  ollama: "Ollama",
  gemini: "Gemini",
  deepseek: "DeepSeek",
  claude: "Claude",
  openai: "OpenAI",
};

export const modelLabel = (model: string): string =>
  MODEL_LABELS[model] ?? model.charAt(0).toUpperCase() + model.slice(1);

const list = (names: string[]): string =>
  names.length <= 1
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/**
 * What Pro adds for this account, from the server's own numbers, so the
 * paywall can never promise something the server will not deliver.
 */
export function proBenefits(account: Account | undefined): string[] {
  if (!account) return [];
  const limits = account.pro_limits;
  const benefits: string[] = [];
  const unlocked = account.pro ? [] : account.pro_models.map(modelLabel);
  if (unlocked.length > 0) {
    benefits.push(`Answers from ${list(unlocked)}`);
  }
  if (limits.cloud_model) {
    benefits.push(`Up to ${limits.cloud_model} AI model answers a month`);
  }
  if (limits.pdf) benefits.push(`Up to ${limits.pdf} PDF questions a month`);
  if (limits.image) benefits.push(`Up to ${limits.image} image scans a month`);
  if (limits.sound) {
    benefits.push(`Up to ${limits.sound} audio transcriptions a month`);
  }
  return benefits;
}

export function formatPlanDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}
