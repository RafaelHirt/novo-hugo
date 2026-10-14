const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const signedBrl = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
});
export const roundCurrency = value => Math.round((value + Number.EPSILON) * 100) / 100;
export const currency = value => brl.format(roundCurrency(value) || 0);
export const signedCurrency = value => signedBrl.format(roundCurrency(value) || 0);
export const number = value => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

// Accept Brazilian monetary values, including amounts pasted with R$.
export function parseCurrency(input) {
  const text = input.trim().replace(/^R\$\s*/, '').replace(/[\s\u00a0]/g, '');
  if (!text) return null;
  let normalized;
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{0,2})?$/.test(text)) {
    normalized = text.replaceAll('.', '').replace(',', '.');
  } else if (/^\d+(?:,\d{0,2})?$/.test(text)) {
    normalized = text.replace(',', '.');
  } else if (/^\d+\.\d{1,2}$/.test(text)) {
    normalized = text;
  } else {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? roundCurrency(value) : null;
}
