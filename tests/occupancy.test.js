import test from 'node:test';
import assert from 'node:assert/strict';
import { occupancyChanges } from '../occupancy.js';
import { rows, initial } from '../data.js';
import { model as hugol } from '../hugol-model.js';
import { model as hugo } from '../hugo-model.js';
import { model as updated } from '../updated-model.js';

test('4 T.A: ocupação em bloco inclui PS Observação e preserva UTI e linhas retiradas',()=>{
  const state=initial();state[1].enabled=false;
  const changes=occupancyChanges(rows,state,'Enfermarias',80.5);
  assert.deepEqual(Object.keys(changes),['0','2','3','4']);
  for(const [id,patch] of Object.entries(changes))Object.assign(state[id],patch);
  assert.equal(state[4].factor,80.5);assert.equal(state[1].factor,90);assert.equal(state[5].factor,95);
});

for(const [label,model] of Object.entries({HUGOL:hugol,HUGO:hugo,Atualização:updated})){
  test(`${label}: aplicar ocupação não altera a seleção dos incrementos ou os outros serviços`,()=>{
    const config=model.presetState('new-5'),policy={includeOmittedWard:false};
    const before=model.snapshot(config,policy),changes=occupancyChanges(before.rows,before.state,'UTI',80.5);
    const after=model.snapshot({...config,edits:changes},policy);
    assert.deepEqual(after.selected,before.selected);assert.deepEqual(after.beds,before.beds);
    for(const row of before.rows){
      assert.equal(after.state[row.id].factor,row.group==='UTI'?80.5:before.state[row.id].factor);
      if(row.group!=='UTI')assert.equal(after.values[row.id],before.values[row.id]);
    }
  });
}
