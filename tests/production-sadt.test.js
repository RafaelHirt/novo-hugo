import test from 'node:test';
import assert from 'node:assert/strict';
import { model, migrateSavedConfig } from '../production-model.js';
import { productionSadtSource as source } from '../production-sadt-source.js';
import { productionIncrementSource } from '../production-increments-source.js';
import { createIncrementModel } from '../increment-model.js';
import { createScenarioReport } from '../pdf-model.js';

const policy = { includeOmittedWard:false }, cents = value => Math.round(value * 100);
const snapshot = config => model.snapshot(config, policy);
const original = createIncrementModel(productionIncrementSource, 'Importação original');

test('A atualização usa somente os 24 quantitativos correspondentes e preserva todos os serviços originais', () => {
  assert.equal(source.sha256, 'c57e05cce4723bdfe08ba7e3910f2d5c2504f4ed1cec29ff6675436264fa56d6');
  assert.deepEqual(source.rows.filter(row => row.group === 'SADT interno').map(row => row.qty),
    [891,275,73240,19,32,272,60,1025,48,215,6288,6967,257,13659,1184,273,1508,214,1672]);
  assert.deepEqual(source.rows.filter(row => row.group === 'SADT externo').map(row => row.qty), [100,80,125,60,80]);
  const s = snapshot(model.presetState('new-0'));
  assert.deepEqual(s.rows.map(row => row.id), productionIncrementSource.bases.new.map(row => row.id));
  for (const entry of source.rows) {
    assert.equal(s.state[entry.id].qty, entry.qty, entry.name);
    assert.equal(s.state[entry.id].unit, entry.unit, entry.name);
    assert.equal(cents(s.values[entry.id]), entry.sourceTotalCents, entry.name);
  }
  for (const [group,total] of Object.entries(source.groupTotalCents)) {
    assert.equal(source.rows.filter(row => row.group === group).reduce((sum,row) => sum + cents(s.values[row.id]), 0), total);
    assert.equal(s.rows.filter(row => row.group === group && s.state[row.id].enabled).length, group === 'SADT interno' ? 19 : 7);
  }
  assert.ok(!s.rows.some(row => row.name === 'Endoscopia de vias urinárias'));
  const before = original.snapshot(original.presetState('new-0'), policy);
  for (const id of ['production-increment-new-70','production-increment-new-73']) {
    assert.deepEqual(s.state[id], before.state[id]); assert.equal(s.values[id], before.values[id]);
  }
  assert.equal(s.totals.find(row => row.group === 'SADT interno').total, 4233876.51);
  assert.equal(s.totals.find(row => row.group === 'SADT externo').total, 202493.90);
  assert.equal(s.total, 30239572.00);
  const report = createScenarioReport({ title:'Novo HUGO', snapshot:s, volume:model.volume });
  assert.ok(!report.rows.some(row => row.id === 'production-increment-new-gec-63'));
  assert.equal(report.rows.find(row => row.id === 'production-increment-new-70').quantity, 40);
  assert.equal(report.rows.find(row => row.id === 'production-increment-new-73').quantity, 150);
});

test('A expansão de UI e UTI preserva cada aumento de produção aprovado sobre os novos quantitativos base', () => {
  const base = snapshot(model.presetState('new-0'));
  const oldBase = original.snapshot(original.presetState('new-0'), policy);
  for (const selected of [['wardBeds'], ['icuBeds'], ['wardBeds','icuBeds']]) {
    const config = { base:'new', selected, edits:{} };
    const after = snapshot(config), before = original.snapshot(config, policy);
    for (const row of after.rows.filter(row => row.group.startsWith('SADT') && before.state[row.id])) {
      assert.equal(after.state[row.id].qty - base.state[row.id].qty,
        before.state[row.id].qty - oldBase.state[row.id].qty, row.name + ': ' + selected.join(','));
    }
  }
  const mri = snapshot(model.setIncrement(model.presetState('new-0'), 'mri', true));
  assert.equal(mri.state['production-increment-new-57'].qty, 100);
  assert.equal(mri.state['production-increment-new-74'].qty, 300);
  assert.equal(mri.total - base.total, 157608);
});

test('A migração troca apenas os quantitativos antigos de SADT e conserva preços, escolhas e rascunhos atuais', () => {
  const same = { base:'same', selected:[], edits:{ 'production-41':{ qty:1234 } } };
  const config = { base:'new', selected:['blood','mri'], edits:{
    'production-increment-new-48':{ qty:56389, unit:10.80 },
    'production-increment-new-70':{ qty:99 },
    'production-increment-new-57':{ qty:101 },
    'production-increment-new-6':{ factor:80 },
    'production-increment-new-87':{ qty:10, unit:6670.06 },
  } };
  const saved = { ...config, version:7, drafts:{ same, new:config } }, copy = structuredClone(saved);
  const migrated = migrateSavedConfig(saved);
  assert.deepEqual(migrated.edits['production-increment-new-48'], { unit:10.80 });
  assert.deepEqual(migrated.edits['production-increment-new-70'], { qty:99 });
  assert.deepEqual(migrated.edits['production-increment-new-57'], { qty:101 });
  assert.deepEqual(migrated.edits['production-increment-new-87'], config.edits['production-increment-new-87']);
  assert.equal(snapshot(migrated).state['production-increment-new-48'].qty, 73240);
  assert.deepEqual(migrated.drafts.same, same); assert.deepEqual(migrated.drafts.new.edits, migrated.edits);
  assert.deepEqual(migrated.selected, config.selected); assert.deepEqual(saved, copy);
  const wrongAddition = { ...config, edits:{ ...config.edits, 'production-increment-new-gec-63':{ qty:20, unit:709.51 } } };
  const latest = migrateSavedConfig({ ...wrongAddition, version:8, drafts:{ same, new:wrongAddition } });
  assert.deepEqual(latest.edits['production-increment-new-48'], config.edits['production-increment-new-48']);
  assert.equal(latest.edits['production-increment-new-gec-63'], undefined);
  assert.equal(latest.drafts.new.edits['production-increment-new-gec-63'], undefined);
  assert.deepEqual(latest.drafts.same, same);
  const restored = snapshot(model.restoreGroup({ ...model.presetState('new-0'), edits:{ 'production-increment-new-48':{ qty:1 } } }, 'SADT interno'));
  assert.equal(restored.state['production-increment-new-48'].qty, 73240);
});
