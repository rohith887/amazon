export function formatNumber(value) {
  return typeof value === "number" ? value.toLocaleString() : value ?? "";
}
