/**
 * lib/chat-validation.ts — A2.1/A2.17
 *
 * Pure payload validation for POST /api/chat. No I/O, no framework
 * imports — unit-testable with node:test.
 */

export const MAX_MESSAGE_LEN = 2000;
export const MAX_HISTORY_ITEMS = 10;
export const MAX_HISTORY_ITEM_LEN = 2000;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function isValidMessage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= MAX_MESSAGE_LEN
  );
}

/**
 * Returns sanitized history, [] when absent, or null when invalid.
 */
export function sanitizeHistory(value: unknown): ChatMessage[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_HISTORY_ITEMS) return null;
  const out: ChatMessage[] = [];
  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" ||
      item.content.length > MAX_HISTORY_ITEM_LEN
    ) {
      return null;
    }
    out.push({ role: item.role, content: item.content });
  }
  return out;
}

export function isValidBusinessRef(value: unknown, maxLen: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLen;
}
