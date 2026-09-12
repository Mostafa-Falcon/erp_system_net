export function generateSku(name: string): string {
  const prefix =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.slice(0, 1))
      .join('')
      .toUpperCase() || 'ITM';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${rand}`;
}

export function calculateMargin(costStr: string, saleStr: string): string {
  const cost = parseFloat(costStr);
  const sale = parseFloat(saleStr);
  if (!cost || cost <= 0 || !sale) return '0.0%';
  const margin = ((sale - cost) / cost) * 100;
  return `${margin.toFixed(1)}%`;
}
