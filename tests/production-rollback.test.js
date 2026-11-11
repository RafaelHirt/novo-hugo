import test from 'node:test';
import assert from 'node:assert/strict';
import { model, migrateSavedConfig } from '../production-model.js';
import { productionIncrementSource } from '../production-increments-source.js';

const policy = { includeOmittedWard:false };
const snapshot = config => model.snapshot(config, policy);

test('O retorno restaura o SADT original, mantendo PA, Escritório, banco de sangue e ressonância', () => {
  const s = snapshot(model.presetState('new-2'));
  assert.equal(s.baseTotal, 29577398.13); assert.equal(s.total, 29980772.88);
  assert.deepEqual(s.selected.map(row => row.id), ['blood','mri']);
  assert.deepEqual(s.rows.map(row => row.id), productionIncrementSource.bases.new.map(row => row.id));
  assert.equal(s.state['production-increment-new-23'].qty, 3000);
  assert.equal(s.state['production-increment-new-87'].qty, 10);
  assert.equal(s.state['production-increment-new-87'].unit, 6670.06);
  for (const row of productionIncrementSource.bases.new.filter(row => row.group.startsWith('SADT') && row.qty > 0)) {
    assert.equal(s.state[row.id].qty, row.qty, row.name);
    assert.equal(s.state[row.id].unit, row.unit, row.name);
  }
  assert.equal(s.state['production-increment-new-57'].qty, 100);
  assert.equal(s.state['production-increment-new-74'].qty, 300);
  assert.equal(snapshot(model.presetState('production')).total, 26618281.37);
});

test('A migração desfaz os quantitativos da versão 8 nos dois rascunhos sem perder preços e outras escolhas', () => {
  const same = { base:'same', selected:[], edits:{ 'production-41':{ qty:1234 } } };
  const draft = { base:'new', selected:['blood','mri'], edits:{
    'production-increment-new-48':{ qty:73240, unit:10.80 },
    'production-increment-new-76':{ qty:60 },
    'production-increment-new-70':{ qty:99 },
    'production-increment-new-57':{ qty:101 },
    'production-increment-new-6':{ factor:80 },
    'production-increment-new-gec-63':{ qty:20, unit:709.51 },
  } };
  const saved = { ...draft, version:8, drafts:{ same, new:draft } }, before = structuredClone(saved);
  const restored = migrateSavedConfig(saved), s = snapshot(restored);
  assert.deepEqual(restored.edits['production-increment-new-48'], { unit:10.80 });
  assert.equal(restored.edits['production-increment-new-76'], undefined);
  assert.equal(restored.edits['production-increment-new-gec-63'], undefined);
  assert.equal(s.state['production-increment-new-48'].qty, 56389);
  assert.equal(s.state['production-increment-new-76'].qty, 140);
  assert.equal(s.state['production-increment-new-70'].qty, 99);
  assert.equal(s.state['production-increment-new-57'].qty, 101);
  assert.equal(s.state['production-increment-new-6'].factor, 80);
  assert.deepEqual(restored.selected, draft.selected);
  assert.deepEqual(restored.drafts.same, same);
  assert.deepEqual(restored.drafts.new.edits, restored.edits);
  assert.deepEqual(saved, before);
  for (const version of [7,9]) {
    const kept = migrateSavedConfig({ ...draft, version });
    assert.deepEqual(kept.edits['production-increment-new-48'], draft.edits['production-increment-new-48']);
  }
});
