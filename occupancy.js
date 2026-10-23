import { escapeHtml as h } from './format.js';

export const validOccupancy = value => Number.isFinite(value) && value >= 0 && Number.isInteger(value * 2);

function activeRows(rows, state, group) {
  return rows.filter(row => row.kind === 'bed' && row.group === group && state[row.id]?.enabled);
}

export function occupancyChanges(rows, state, group, value) {
  if (!validOccupancy(value)) throw new Error('Informe uma ocupação positiva ou zero, em passos de 0,5.');
  return Object.fromEntries(activeRows(rows, state, group).map(row => [row.id, { factor: value }]));
}

export function occupancyControl(group) {
  return `<form class="group-occupancy" data-occupancy-group="${h(group)}"><label><span>Ocupação do bloco</span><span class="factor-field"><input type="number" min="0" step="0.5" data-occupancy-input aria-label="Ocupação do bloco de ${h(group)}" placeholder="Várias taxas"><span>%</span></span></label><button type="submit" class="button secondary" disabled>Aplicar ao bloco</button><small data-occupancy-caption></small></form>`;
}

export function syncOccupancyControls(container, rows, state) {
  for (const form of container.querySelectorAll('[data-occupancy-group]')) {
    const group = form.dataset.occupancyGroup, active = activeRows(rows, state, group);
    const factors = [...new Set(active.map(row => state[row.id].factor))];
    const field = form.querySelector('[data-occupancy-input]');
    field.value = factors.length === 1 ? factors[0] : '';
    field.removeAttribute('aria-invalid');
    field.placeholder = active.length ? 'Várias taxas' : 'Sem linhas ativas';
    field.disabled = active.length === 0;
    form.querySelector('button').disabled = active.length === 0 || factors.length !== 1;
    form.querySelector('[data-occupancy-caption]').textContent = `Aplica às ${active.length} linhas ativas deste bloco${group === 'Enfermarias' && active.some(row => row.bedType === 'observation') ? ', incluindo PS Observação' : ''}.`;
  }
}

export function bindOccupancyControls(container, getSnapshot, onApply) {
  container.addEventListener('input', event => {
    const field = event.target;
    if (!field.hasAttribute('data-occupancy-input')) return;
    const valid = field.value !== '' && field.validity.valid && validOccupancy(Number(field.value));
    field.setAttribute('aria-invalid', field.value !== '' && !valid ? 'true' : 'false');
    field.form.querySelector('button').disabled = !valid;
  });
  container.addEventListener('submit', event => {
    const form = event.target;
    if (!form.hasAttribute('data-occupancy-group')) return;
    event.preventDefault();
    const field = form.querySelector('[data-occupancy-input]');
    if (field.value === '' || !field.reportValidity() || !validOccupancy(Number(field.value))) return;
    const { rows, state } = getSnapshot();
    onApply(occupancyChanges(rows, state, form.dataset.occupancyGroup, Number(field.value)));
    const replacement = [...container.querySelectorAll('[data-occupancy-group]')].find(item => item.dataset.occupancyGroup === form.dataset.occupancyGroup);
    replacement?.querySelector('[data-occupancy-input]').focus({ preventScroll: true });
  });
}
