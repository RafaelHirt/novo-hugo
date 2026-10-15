import { roundCurrency } from './format.js';

export const normalize = value => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export const serviceKey = row => normalize(row.group + '|' + row.name).replace(/[^a-z0-9|]/g, '');
const cents = value => Math.round(value * 100);

export function buildComparison(scenarios, { referenceId = 'current', annual = false, differencesOnly = true, query = '' } = {}) {
  const reference = scenarios.find(item => item.id === referenceId) || scenarios[0];
  if (!reference) return { scenarios: [], groups: [], services: [], allGroupCount: 0 };
  const multiplier = annual ? 12 : 1;
  const difference = (amount, base) => ({ delta: roundCurrency(amount - base), percent: base === 0 ? null : (amount - base) / base * 100 });
  const summaries = scenarios.map(item => ({ ...item, amount: roundCurrency(item.snapshot.total * multiplier), ...difference(roundCurrency(item.snapshot.total * multiplier), roundCurrency(reference.snapshot.total * multiplier)), isReference: item.id === reference.id }));
  const groupNames = [...new Set(scenarios.flatMap(item => item.snapshot.totals.map(group => group.group)))];
  const groups = groupNames.map(group => {
    const amount = item => roundCurrency((item.snapshot.totals.find(entry => entry.group === group)?.total || 0) * multiplier);
    const base = amount(reference);
    const cells = scenarios.map(item => ({ id: item.id, amount: amount(item), ...difference(amount(item), base), isReference: item.id === reference.id }));
    return { group, cells, impact: Math.max(...cells.map(cell => Math.abs(cell.delta))) };
  }).filter(row => !differencesOnly || row.cells.some(cell => cents(cell.amount) !== cents(row.cells[0].amount))).sort((a,b) => b.impact-a.impact);
  const byScenario = scenarios.map(item => new Map(item.snapshot.rows.map(row => [serviceKey(row), row])));
  const keys = [...new Set(byScenario.flatMap(map => [...map.keys()]))];
  const referenceIndex = scenarios.findIndex(item => item.id === reference.id);
  const search = normalize(query.trim());
  const services = keys.map(key => {
    const first = byScenario.map(map => map.get(key)).find(Boolean);
    const cells = scenarios.map((item,index) => {
      const row = byScenario[index].get(key), state = row ? item.snapshot.state[row.id] : null;
      return { id:item.id, row, present:Boolean(row), enabled:state?.enabled || false, quantity:state?.enabled ? state.qty : 0, amount:roundCurrency((row ? item.snapshot.values[row.id] : 0) * multiplier), isReference:item.id === reference.id, excluded:Boolean(row && item.snapshot.includeOmittedWard === false && row.countedInWorkbook === false) };
    });
    for (const cell of cells) Object.assign(cell,difference(cell.amount,cells[referenceIndex].amount));
    return { key, name:first.name, group:first.group, cells, impact:Math.max(...cells.map(cell=>Math.abs(cell.delta))) };
  }).filter(row => (!search || normalize(row.name+' '+row.group).includes(search)) && (!differencesOnly || row.cells.some(cell => cents(cell.amount)!==cents(row.cells[0].amount) || cell.quantity!==row.cells[0].quantity))).sort((a,b)=>b.impact-a.impact);
  return { scenarios:summaries, referenceId:reference.id, referenceLabel:reference.label, multiplier, groups, services, allGroupCount:groupNames.length };
}
