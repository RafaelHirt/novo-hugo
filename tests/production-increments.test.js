import test from 'node:test';
import assert from 'node:assert/strict';
import { productionIncrementSource as source } from '../production-increments-source.js';
import { createIncrementModel } from '../increment-model.js';

const model = createIncrementModel(source, 'Valores e produção');
const policy = { includeOmittedWard: false };
const snapshot = config => model.snapshot(config, policy);
const cents = value => Math.round(value * 100);

test('O novo anexo fornece todos os preços e fecha suas 354 linhas e sete totais em centavos', () => {
  assert.equal(source.sha256, 'cfedf64f35f2c7286c5bdbea6e83e14a85fd44bd1b13ba55fdf9d31dae9cec7f');
  assert.deepEqual(model.workbookAudit(policy).map(item => cents(item.dashboardTotal)), [2771981285,2930481403,2955058078,2970818878,2989691998,3081045248,3417085087]);
  let count = 0;
  for (const preset of model.presets) {
    const s = snapshot(model.presetState(preset.id));
    assert.equal(cents(s.total), preset.sourceTotalCents);
    for (const row of s.rows) {
      assert.equal(cents(s.rawValues[row.id]), row.sourceTotalCents, preset.id + ': ' + row.name);
      assert.equal(model.volume(row, s.state[row.id]), row.sourceVolume, preset.id + ': ' + row.name);
      assert.equal(row.sourceGreenCell, row.sourceUnitCell);
      assert.ok(Number.isFinite(row.unit));
      assert.equal(row.unitBasis, ({K:'P25',L:'P50',M:preset.base === 'same'?'P75':'P25',N:'P50',O:'P75'})[row.sourceUnitCell[0]]);
      count++;
    }
  }
  assert.equal(count, 354);
});

test('Os seis incrementos usam os preços atualizados do novo arquivo, sem custos a informar', () => {
  assert.deepEqual(model.increments.map(item => item.amountCents), [24576675,15760800,18873120,91353250,130387920,205611727]);
  const base = model.presetState('new-0'), s = snapshot(base);
  assert.equal(model.priceInputs.length, 0);
  for (const increment of model.increments) assert.equal(model.canSelectIncrement(base, increment.id), true);
  for (const [row, price, percentile] of [[23,624.8,'P75'],[26,1572.76,'P50'],[57,394.02,'P50'],[74,394.02,'P50'],[80,3654.13,'P75'],[83,284.33,'P50'],[84,1300.77,'P50']]) {
    const item = s.rows.find(item => item.sourceRow === row);
    assert.equal(item.unit, price); assert.equal(item.unitBasis, percentile);
  }
  const complete = snapshot(model.presetState('new-5'));
  for (const row of complete.rows.filter(item => item.group.startsWith('SADT') && source.increments.find(item => item.id === 'beds').patches[item.id])) {
    assert.equal(row.sourceSheet, 'HUGO - FINAL');
  }
});

test('Todas as 64 combinações de novos serviços e leitos fecham e preservam a capacidade correspondente', () => {
  const bedCosts = [0,130387920,205611727,336039839];
  for (let mask=0; mask<64; mask++) {
    const selected = model.increments.filter((item,index) => mask & (1 << index));
    const s = snapshot({base:'new',selected:selected.map(item => item.id),edits:{}});
    const serviceCost = selected.filter(item => !item.addedBeds).reduce((sum,item) => sum + item.amountCents, 0);
    assert.equal(cents(s.total), 2930481403 + serviceCost + bedCosts[mask >> 4], 'mask ' + mask);
    assert.deepEqual(s.beds, {ward:336+(mask&16?35:0),icu:70+(mask&32?20:0),total:406+(mask&16?35:0)+(mask&32?20:0)});
    assert.equal(cents(s.total), s.totals.reduce((sum,item) => sum + cents(item.total), 0));
  }
});

test('Hemodinâmica 450 substitui 250 ao preço atualizado e altera somente sua linha', () => {
  const base = model.presetState('new-5');
  const result = model.setHemodynamicsVolume(base, 450), s = snapshot(result);
  assert.equal(s.total, 34901676.87);
  assert.equal(s.state['production-increment-new-80'].qty, 450);
  assert.equal(s.state['production-increment-new-80'].unit, 3654.13);
  assert.equal(s.values['production-increment-new-80'], 1644358.50);
  assert.equal(snapshot(base).total, 34170850.87);
});
