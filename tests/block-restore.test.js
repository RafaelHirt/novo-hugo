import test from 'node:test';
import assert from 'node:assert/strict';
import { model as hugol } from '../hugol-model.js';
import { model as hugo } from '../hugo-model.js';
import { model as updated } from '../updated-model.js';
import { model as production } from '../production-model.js';
import { model as rebalance } from '../rebalance-model.js';

const policy={includeOmittedWard:false};
for(const [name,model,preset] of [['HUGOL',hugol,'new-5'],['HUGO',hugo,'new-5'],['Valores',updated,'new-5'],['Produção',production,'production'],['Reequilíbrio',rebalance,'rebalance']]){
  test(`${name}: restaurar o bloco devolve todos os seus campos e mantém outros blocos e incrementos`,()=>{
    const config=model.presetState(preset),base=model.snapshot(config,policy);
    const ward=base.rows.filter(row=>row.group==='Enfermarias'),icu=base.rows.find(row=>row.group==='UTI');
    const edits={
      [ward[0].id]:{enabled:false,qty:25,unit:1100,factor:80},
      [ward[1].id]:{qty:50,factor:81.5},
      [icu.id]:{unit:3100,factor:80},
    };
    const changed={...config,edits},saved=JSON.stringify(changed);
    const restored=model.restoreGroup(changed,'Enfermarias'),after=model.snapshot(restored,policy);
    assert.equal(JSON.stringify(changed),saved);
    assert.deepEqual(restored.selected,config.selected);assert.equal(restored.base,config.base);
    assert.deepEqual(restored.edits,{[icu.id]:edits[icu.id]});
    for(const row of ward){assert.deepEqual(after.state[row.id],base.state[row.id]);assert.equal(after.values[row.id],base.values[row.id]);}
    assert.equal(after.state[icu.id].factor,80);assert.equal(after.state[icu.id].unit,3100);
    const final=model.snapshot(model.restoreGroup(restored,'UTI'),policy);
    assert.equal(final.total,base.total);assert.deepEqual(final.beds,base.beds);
    const surgery=base.rows.find(row=>row.group==='Cirurgias');
    const surgeryChanged={...config,edits:{[surgery.id]:{enabled:false,qty:1,unit:500,factor:1}}};
    assert.equal(model.snapshot(model.restoreGroup(surgeryChanged,'Cirurgias'),policy).total,base.total);
  });
}
