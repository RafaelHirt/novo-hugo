import { escapeHtml as h, number } from './format.js';
import { icon } from './icons.js';

export const validOccupancy = value => Number.isFinite(value) && value >= 0 && Number.isInteger(value * 2);

function activeRows(rows, state, group) {
  return rows.filter(row => row.kind === 'bed' && row.group === group && state[row.id]?.enabled);
}

export function occupancyChanges(rows, state, group, value) {
  if (!validOccupancy(value)) throw new Error('Informe uma ocupação positiva ou zero, em passos de 0,5.');
  return Object.fromEntries(activeRows(rows, state, group).map(row => [row.id, { factor: value }]));
}

export function occupancyControl(group) {
  return `<form class="group-occupancy" data-occupancy-group="${h(group)}"><label><span>Ocupação do bloco</span><span class="factor-field"><input type="number" min="0" step="0.5" data-occupancy-input aria-label="Ocupação do bloco de ${h(group)}" placeholder="Digitar %"><span>%</span></span></label><button type="submit" class="button secondary" disabled>Aplicar ao bloco</button><small data-occupancy-caption></small></form>`;
}

export function blockControls(group, withOccupancy) {
  return `<div class="block-toolbar" data-block-group="${h(group)}">${withOccupancy ? occupancyControl(group) : '<span class="block-toolbar-spacer"></span>'}<div class="block-restore-actions"><small data-block-status hidden></small><button type="button" class="button secondary block-restore" data-block-restore="${h(group)}" aria-label="${h('Restaurar bloco de ' + group)}" title="Restaurar os ajustes de todos os serviços deste bloco" disabled>${icon('reset')}Restaurar bloco</button></div></div>`;
}

export function updateOccupancyComparison(element, before, after) {
  element.hidden = before === after;
  element.title = 'Ocupação original da referência e ocupação ajustada';
  if (element.hidden) { element.replaceChildren(); return; }
  element.innerHTML = `<span><small>Antes</small><strong>${h(number(before))}%</strong></span><span class="occupancy-change-arrow" aria-hidden="true">→</span><span><small>Atual</small><strong>${h(number(after))}%</strong></span>`;
}

export function syncBlockControls(container, rows, state, modifiedIds) {
  for (const form of container.querySelectorAll('[data-occupancy-group]')) {
    const group = form.dataset.occupancyGroup, active = activeRows(rows, state, group);
    const factors = [...new Set(active.map(row => state[row.id].factor))];
    const field = form.querySelector('[data-occupancy-input]');
    field.value = factors.length === 1 ? factors[0] : '';
    field.removeAttribute('aria-invalid');
    field.placeholder = active.length ? 'Digitar %' : 'Sem linhas ativas';
    field.disabled = active.length === 0;
    form.querySelector('button').disabled = active.length === 0 || factors.length !== 1;
    form.querySelector('[data-occupancy-caption]').textContent = `Aplica às ${active.length} linhas ativas deste bloco${group === 'Enfermarias' && active.some(row => row.bedType === 'observation') ? ', incluindo PS Observação' : ''}.`;
  }
  const modified = new Set(modifiedIds);
  for (const toolbar of container.querySelectorAll('[data-block-group]')) {
    const count = rows.filter(row => row.group === toolbar.dataset.blockGroup && modified.has(row.id)).length;
    toolbar.querySelector('[data-block-restore]').disabled = count === 0;
    const status = toolbar.querySelector('[data-block-status]');
    status.hidden = count === 0;
    status.textContent = `${count} ${count === 1 ? 'serviço alterado' : 'serviços alterados'}`;
  }
}

export function bindBlockControls(container, getSnapshot, onApply, onRestore) {
  container.addEventListener('click', event => {
    const button = event.target.closest('[data-block-restore]');
    if (!button) return;
    const group = button.dataset.blockRestore;
    onRestore(group);
    const replacement = [...container.querySelectorAll('[data-block-restore]')].find(item => item.dataset.blockRestore === group);
    const target = replacement?.closest('details').querySelector('summary') || container.querySelector('summary, button, input');
    target?.focus({ preventScroll: true });
  });
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
