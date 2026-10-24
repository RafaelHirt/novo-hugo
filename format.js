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
export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

// HUGOL percentiles come from the selected column in the user's image.
// A matching price validates an explicit service reference; it never selects a P.
export function describePriceReference(row, unit, fallback = '') {
  const edited = roundCurrency(unit) !== roundCurrency(row.unit);
  const origin = `Valor de origem: ${currency(row.unit)}${row.sourceUnitCell ? ' · ' + row.sourceUnitCell : ''}`;
  const reference = row.priceReference;
  if (reference?.source === 'HUGOL image') {
    const listed = Number.isFinite(reference.unit);
    const matches = listed && roundCurrency(unit) === roundCurrency(reference.unit);
    const status = !listed ? 'not_listed' : matches ? 'match' : 'different';
    const label = !listed ? 'Sem referência na imagem' : matches ? `Ref. HUGOL: ${reference.percentile}` : 'Diverge da referência HUGOL';
    const detail = listed && !matches ? `Imagem HUGOL · ${reference.percentile}: ${currency(reference.unit)}` : '';
    const evidence = listed ? `Imagem HUGOL, item ${reference.items}: ${reference.service} · verde: ${reference.percentile} = ${currency(reference.unit)}${reference.linkedPriceFormula ? ' · vínculo na planilha: ' + reference.linkedPriceFormula : ''}` : 'Este serviço não está listado na imagem HUGOL fornecida.';
    return { label: `${edited ? 'Editado · ' : ''}${label}`, percentile: matches ? reference.percentile : '', status, detail, edited,
      title: `${origin}. ${evidence}`, exportLabel: `${label}${detail ? ' · ' + detail : ''}${edited ? ' (preço editado)' : ''}` };
  }
  const label = row.unitBasis ? `Referência: ${row.unitBasis}` : row.unitReference || fallback;
  return { label: edited ? `Editado · ${row.unitBasis ? 'ref. ' + row.unitBasis : label}` : label,
    percentile: row.unitBasis || '', status: '', detail: '', edited, title: origin,
    exportLabel: `${row.unitBasis || row.unitReference || fallback}${edited ? ' (preço editado)' : ''}` };
}

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
