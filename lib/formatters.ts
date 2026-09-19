export function formatMoney(amount: number | string): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount as string);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-AR");
}

export function normalizeString(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
