import test from 'node:test';
import assert from 'node:assert/strict';
import { model, migrateSavedConfig, productionScenarioSource } from '../production-model.js';
import { createIncrementModel } from '../increment-model.js';
import { createScenarioReport } from '../pdf-model.js';

const policy = { includeOmittedWard: false };
const original = createIncrementModel(productionScenarioSource, 'Importação original');
const pa = 'production-increment-new-23', office = 'production-increment-new-87';
const cents = value => Math.round(value * 100);

test('As correções alteram somente PA e Escritório nas 64 combinações e preservam todos os adicionais e o SADT', () => {
  for (let mask = 0; mask < 64; mask++) {
    const config = { base:'new', selected:model.increments.filter((_, index) => mask & (1 << index)).map(row => row.id), edits:{} };
    const before = original.snapshot(config, policy), after = model.snapshot(config, policy);
    assert.equal(cents(after.total) - cents(before.total), 27258410, 'combinação ' + mask);
    assert.equal(after.state[pa].qty, 3000); assert.equal(after.state[pa].unit, 624.80);
    assert.equal(after.values[pa], 1874400);
    assert.equal(after.state[office].qty, 10); assert.equal(after.state[office].unit, 6670.06);
    assert.equal(after.values[office], 66700.60);
    assert.deepEqual(after.beds, before.beds);
    for (const row of after.rows.filter(row => ![pa, office].includes(row.id))) {
      assert.deepEqual(after.state[row.id], before.state[row.id], row.name);
      assert.equal(after.values[row.id], before.values[row.id], row.name);
    }
  }
  const base = model.presetState('new-0');
  for (const increment of model.increments) assert.equal(model.incrementQuote(base, increment.id, policy), original.incrementQuote(base, increment.id, policy));
  assert.deepEqual(model.snapshot(model.presetState('production'), policy), {
    ...original.snapshot(original.presetState('production'), policy), occupancyLabel:'Atual HUGO - Taxa de ocupação real',
  });
  assert.equal(productionScenarioSource.bases.new.find(row => row.id === pa).qty, 2588);
  assert.equal(productionScenarioSource.bases.new.find(row => row.id === office).unit, 5153.41);
});

test('A quantidade fixa resiste a edições antigas, restauração, novos serviços e aparece corretamente no PDF', () => {
  let config = { ...model.presetState('new-0'), edits:{ [pa]:{ qty:9999 }, [office]:{ enabled:false } } };
  config = model.setIncrement(config, 'blood', true);
  const snapshot = model.snapshot(config, policy), row = snapshot.rows.find(row => row.id === pa);
  assert.equal(row.fixedQty, 3000); assert.equal(row.quantityCorrection.originalQty, 2588);
  assert.equal(snapshot.state[pa].qty, 3000); assert.equal(snapshot.values[pa], 1874400);
  assert.ok(!snapshot.modifiedIds.includes(pa));
  const restored = model.snapshot(model.restoreGroup(config, 'Emergência'), policy);
  assert.equal(restored.state[pa].qty, 3000); assert.equal(restored.values[pa], 1874400);
  const report = createScenarioReport({ title:'Novo HUGO', snapshot, volume:model.volume });
  assert.equal(report.rows.find(row => row.id === pa).quantity, 3000);
  assert.equal(report.rows.find(row => row.id === pa).amount, 1874400);
  assert.equal(snapshot.state[office].enabled, false);
});

test('Migração aplica as correções aos rascunhos antigos e preserva os ajustes dos demais serviços e do HUGO atual', () => {
  const same = { base:'same', selected:[], edits:{ 'production-22':{ qty:2802, unit:700 } } };
  const candidate = { base:'new', selected:['blood','mri'], edits:{
    [pa]:{ qty:2802, unit:624.80 }, [office]:{ qty:5, unit:5153.41, enabled:true },
    'production-increment-new-6':{ factor:80 },
  } };
  for (const version of [5, 6]) {
    const saved = { ...candidate, version, drafts:{ same, new:candidate } }, copy = structuredClone(saved);
    const result = migrateSavedConfig(saved), snapshot = model.snapshot(result, policy);
    assert.deepEqual(result.edits[pa], { unit:624.80 }); assert.deepEqual(result.edits[office], { enabled:true });
    assert.equal(snapshot.state[pa].qty, 3000); assert.equal(snapshot.state[office].qty, 10);
    assert.equal(snapshot.state[office].unit, 6670.06); assert.equal(snapshot.state['production-increment-new-6'].factor, 80);
    assert.deepEqual(result.drafts.same, same); assert.deepEqual(result.drafts.new.edits, result.edits);
    assert.deepEqual(result.selected, ['blood','mri']); assert.deepEqual(saved, copy);
  }
  const current = migrateSavedConfig({ ...candidate, version:7 });
  assert.deepEqual(current.edits[office], candidate.edits[office]);
  assert.deepEqual(current.edits[pa], { unit:624.80 });
});
