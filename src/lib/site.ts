export const SITE_NAME = "Lily's Books";
export const SITE_AUTHOR = "Лілія Кухарець";
export const SITE_DESCRIPTION =
  "Офіційний сайт письменниці Лілії Кухарець: книги, електронні та паперові видання, події й контакти.";
export const SITE_KEYWORDS = [
  "Лілія Кухарець",
  "Lily's Books",
  "українські книги",
  "Звичайна",
  "Інакша",
  "ромапокаліптика",
];

export function stripHtml(html?: string): string {
  return (html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const WEAK_UKRAINIAN_ENDINGS = new Set([
  "що",
  "не",
  "і",
  "та",
  "й",
  "у",
  "в",
  "на",
  "з",
  "зі",
  "із",
  "до",
  "про",
]);

export function buildMetaDescription(text: string, targetLength = 155): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= targetLength) return normalized;

  const minLength = 110;
  const sentenceMatches = normalized.match(/[^.!?…]+[.!?…]+/g) ?? [];
  let sentenceDescription = "";

  for (const sentence of sentenceMatches) {
    const candidate = `${sentenceDescription} ${sentence}`.trim();
    if (candidate.length > targetLength) break;
    sentenceDescription = candidate;
  }

  if (sentenceDescription.length >= minLength) return sentenceDescription;

  const words = normalized.slice(0, targetLength + 1).trim().split(/\s+/);
  while (words.length > 1) {
    const last = words[words.length - 1].replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
    const candidate = words.join(" ").replace(/[,.!?;:\s]+$/, "");
    if (candidate.length <= targetLength && !WEAK_UKRAINIAN_ENDINGS.has(last)) {
      return `${candidate}…`;
    }
    words.pop();
  }

  return `${normalized.slice(0, targetLength - 1).trimEnd()}…`;
}
