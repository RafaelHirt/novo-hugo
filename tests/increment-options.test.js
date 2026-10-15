import test from 'node:test';
import assert from 'node:assert/strict';
import { model as hugol } from '../hugol-model.js';
import { model as hugo } from '../hugo-model.js';
const policy={includeOmittedWard:false};
for (const [basis,model] of Object.entries({HUGOL:hugol,HUGO:hugo})) {
  test(`${basis}: 450 hemodinâmicas usam o preço unitário e preservam os outros incrementos`,()=>{
    const config=model.setHemodynamicsVolume({...model.presetState('new-0'),selected:['blood'],edits:{}},450);
    const snapshot=model.snapshot(config,policy);
    const row=snapshot.rows.find(item=>item.group==='Hemodinâmica');
    assert.equal(snapshot.state[row.id].qty,450);
    assert.equal(snapshot.values[row.id],2010123);
    assert.deepEqual(config.selected,['blood','hemodynamics']);
    assert.equal(model.snapshot(model.setHemodynamicsVolume(config,250),policy).values[row.id],1116735);
    const customUnit=model.snapshot({...config,edits:{...config.edits,[row.id]:{qty:450,unit:3500}}},policy);
    assert.equal(customUnit.values[row.id],1575000);
    assert.throws(()=>model.setHemodynamicsVolume(config,451),/250 ou 450/);
  });
  test(`${basis}: salvar seleção antiga de adequação preserva UI e UTI, sem duplicar SADT`,()=>{
    const legacy={base:'new',selected:['mri','beds'],edits:{}};
    const migrated=model.normalizeConfig(legacy);
    assert.deepEqual(migrated.selected,['mri','wardBeds','icuBeds']);
    assert.deepEqual(model.snapshot(legacy,policy).beds,{ward:353,icu:90,total:443});
    assert.equal(model.snapshot(legacy,policy).total,model.snapshot(migrated,policy).total);
    const row=model.snapshot(migrated,policy).rows.find(item=>item.name==='Análises clínicas');
    const changed=model.setIncrement({...migrated,edits:{[row.id]:{qty:1}}},'wardBeds',false);
    assert.equal(changed.edits[row.id],undefined);
    assert.equal(model.snapshot(changed,policy).state[row.id].qty,59208);
  });
  test(`${basis}: retirar todas as UI zera a capacidade sem produzir leitos negativos`,()=>{
    const config=model.presetState('new-0');
    for (const row of model.snapshot(config,policy).rows.filter(row=>row.bedType==='ward')) config.edits[row.id]={enabled:false};
    assert.deepEqual(model.snapshot(config,policy).beds,{ward:0,icu:70,total:70});
  });
}
