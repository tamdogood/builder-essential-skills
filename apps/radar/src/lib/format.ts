export function formatDate(value?: string, options: Intl.DateTimeFormatOptions = {}): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatDateTime(value?: string): string {
  return formatDate(value, { hour: "numeric", minute: "2-digit" });
}

export function formatDuration(milliseconds?: number): string {
  if (milliseconds === undefined) return "Not recorded";
  if (milliseconds < 1000) return `${milliseconds} ms`;
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes} min ${remainder} sec` : `${minutes} min`;
}

export function formatSkill(value: string): string {
  return value
    .split("-")
    .map((part) => (part.length <= 3 ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`))
    .join(" ");
}

export function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: value >= 1000 ? "compact" : "standard" }).format(value);
}

export function verdictTone(verdict: string): "positive" | "caution" | "negative" | "neutral" {
  if (verdict === "SUBSTANTIATED") return "positive";
  if (verdict.includes("PROMISING") || verdict.includes("MIXED")) return "caution";
  if (verdict.includes("CONTRADICTED") || verdict.includes("INTEGRITY") || verdict.includes("RETRACTED")) {
    return "negative";
  }
  return "neutral";
}

export function statusTone(status: string): "positive" | "caution" | "negative" | "neutral" | "accent" {
  if (["completed", "passed", "promote", "substantiated", "keep"].includes(status.toLowerCase())) return "positive";
  if (["failed", "drop", "retracted", "blocked", "discard"].includes(status.toLowerCase())) return "negative";
  if (["partial", "running", "inconclusive", "verify paper", "test"].includes(status.toLowerCase())) {
    return "caution";
  }
  if (["queued", "watch", "baseline"].includes(status.toLowerCase())) return "accent";
  return "neutral";
}
