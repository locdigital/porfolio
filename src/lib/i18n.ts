export function formatDate(date: Date, style: "short" | "article" = "article"): string {
  return new Intl.DateTimeFormat(style === "short" ? "en-GB" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}
