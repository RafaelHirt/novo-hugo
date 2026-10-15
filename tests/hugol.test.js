import test from 'node:test';
import assert from 'node:assert/strict';
import { hugolSource } from '../hugol-source.js';
import { hugolSnapshot, presetState, increments, presets, setIncrement, workbookAudit } from '../hugol-model.js';

const sheetPolicy = { includeOmittedWard: false };
const correctedPolicy = { includeOmittedWard: true };
const cents = amount => Math.round(amount * 100);

test('As sete abas solicitadas reproduzem os totais da planilha em centavos', () => {
  assert.equal(presets.length, 7);
  assert.deepEqual(workbookAudit(sheetPolicy).map(item => cents(item.dashboardTotal)), [2596453296, 2607474834, 2625518784, 2639768784, 2663108184, 2774781684, 3073213988]);
  assert.ok(workbookAudit(sheetPolicy).every(item => item.difference === 0));
  assert.ok(presets.every(item => !['Azul', 'HUGO - ATUAL', 'RESUMO'].includes(item.sourceSheet)));
});

test('A divergência de R$ 1.308.864,45 fica identificada em todos os cenários do novo prédio', () => {
  const audit = workbookAudit(correctedPolicy);
  assert.equal(audit[0].difference, 0);
  assert.ok(audit.slice(1).every(item => cents(item.difference) === 130886445));
  assert.equal(cents(audit[1].dashboardTotal), 2738361279);
  assert.equal(cents(audit.at(-1).dashboardTotal), 3204100433);
});

test('Todas as 32 combinações dos cinco incrementos são independentes e fecham em centavos', () => {
  for (const policy of [sheetPolicy, correctedPolicy]) {
    const base = hugolSnapshot(presetState('new-0'), policy);
    for (let mask = 0; mask < 32; mask++) {
      const selected = increments.filter((item, index) => mask & (1 << index));
      const snapshot = hugolSnapshot({ base: 'new', selected: selected.map(item => item.id), edits: {} }, policy);
      assert.equal(cents(snapshot.total), cents(base.total) + selected.reduce((sum, item) => sum + item.amountCents, 0), `mask ${mask}`);
      assert.deepEqual(snapshot.beds, selected.some(item => item.id === 'beds') ? { ward: 371, icu: 90, total: 461 } : { ward: 336, icu: 70, total: 406 });
      assert.equal(cents(snapshot.totals.reduce((sum, item) => sum + item.total, 0)), cents(snapshot.total));
    }
  }
});

test('Banco com SAD e ressonância com hemodinâmica funcionam sem ativar outros incrementos', () => {
  const bloodSad = hugolSnapshot({ base: 'new', selected: ['blood', 'sad'], edits: {} }, sheetPolicy);
  assert.equal(cents(bloodSad.total), 2648858184);
  assert.equal(bloodSad.state['new-57'].enabled, false);
  const mriHemodynamics = hugolSnapshot({ base: 'new', selected: ['mri', 'hemodynamics'], edits: {} }, sheetPolicy);
  assert.equal(cents(mriHemodynamics.total), 2733398334);
  assert.equal(mriHemodynamics.state['new-83'].enabled, false);
});

test('Adequação de leitos altera duas UI/UTI e os 18 volumes de SADT previstos na planilha', () => {
  const base = hugolSnapshot(presetState('new-0'), sheetPolicy);
  const adjusted = hugolSnapshot({ base: 'new', selected: ['beds'], edits: {} }, sheetPolicy);
  assert.equal(adjusted.state['new-6'].qty, 91);
  assert.equal(adjusted.state['new-17'].qty, 50);
  assert.equal(adjusted.state['new-48'].qty, 64283);
  assert.equal(cents(adjusted.delta), 298432304);
  assert.equal(cents(adjusted.totals.find(item => item.group === 'SADT interno').total - base.totals.find(item => item.group === 'SADT interno').total), 40134452);
  assert.equal(adjusted.state['new-57'].enabled, false);
});

test('A base sem aumento exclui PS Observação dos 388 leitos e mantém seu custo', () => {
  const snapshot = hugolSnapshot(presetState('same'), sheetPolicy);
  assert.deepEqual(snapshot.beds, { ward: 318, icu: 70, total: 388 });
  assert.equal(snapshot.values['same-10'], 292692.28);
});

test('Editar ou retirar linhas atualiza o custo e leitos; alternar um incremento só restaura suas linhas', () => {
  let config = { base: 'new', selected: ['blood'], edits: { 'new-6': { qty: 50 }, 'new-83': { qty: 900 } } };
  const edited = hugolSnapshot(config, correctedPolicy);
  assert.equal(edited.beds.ward, 330);
  assert.equal(edited.state['new-83'].qty, 900);
  config = setIncrement(config, 'blood', false);
  assert.deepEqual(config.edits, { 'new-6': { qty: 50 } });
  assert.equal(hugolSnapshot(config, correctedPolicy).state['new-83'].enabled, false);
  const disabled = hugolSnapshot({ ...config, edits: { 'new-6': { enabled: false } } }, correctedPolicy);
  assert.equal(disabled.beds.total, 350);
  assert.equal(disabled.values['new-6'], 0);
});

test('Cada linha das sete abas reproduz o custo armazenado, incluindo ROUNDUP e horas fracionadas', () => {
  for (const preset of presets) {
    const snapshot = hugolSnapshot(presetState(preset.id), correctedPolicy);
    for (const row of snapshot.rows) assert.equal(cents(snapshot.rawValues[row.id]), row.sourceTotalCents, `${preset.id} ${row.name}`);
  }
  assert.equal(hugolSource.bases.new.length, 52);
  assert.equal(hugolSource.bases.same.length, 42);
  assert.throws(() => hugolSnapshot(presetState('new-0')), /subtotal/);
});
