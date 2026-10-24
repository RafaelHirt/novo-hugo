import test from 'node:test';
import assert from 'node:assert/strict';
import {model as hugol} from '../hugol-model.js';
import {model as production} from '../production-model.js';

const policy={includeOmittedWard:false};
const cents=value=>Math.round(value*100);
function closes(snapshot) {
  const c=snapshot.calculation;
  assert.equal(cents(c.base)+cents(c.increments)+cents(c.adjustments),cents(snapshot.total));
  assert.equal(c.total,snapshot.total);
}

test('HUGOL completo distingue a base de R$ 27.381.560,79 do total atual de R$ 32.038.952,33',()=>{
  const snapshot=hugol.snapshot(hugol.presetState('new-5'),policy);
  assert.deepEqual(snapshot.calculation,{base:27381560.79,increments:4657391.54,adjustments:0,total:32038952.33});
  assert.equal(snapshot.selected.length,6);closes(snapshot);
});

test('Editar ou retirar serviços aparece como ajuste sem alterar a base de referência e os incrementos',()=>{
  const config=hugol.presetState('new-5');
  config.edits={'new-6':{factor:80,unit:1100},'new-29':{enabled:false}};
  const snapshot=hugol.snapshot(config,policy);
  assert.equal(snapshot.calculation.base,27381560.79);
  assert.equal(snapshot.calculation.increments,4657391.54);
  assert.notEqual(snapshot.calculation.adjustments,0);closes(snapshot);
  const restored=hugol.snapshot(hugol.restoreGroup(hugol.restoreGroup(config,'Enfermarias'),'Hospital dia'),policy);
  assert.equal(restored.calculation.adjustments,0);assert.equal(restored.total,32038952.33);
});

test('Produção usa apenas o total real da planilha como base de cálculo',()=>{
  const snapshot=production.snapshot(production.presetState('production'),policy);
  assert.deepEqual(snapshot.calculation,{base:26618281.37,increments:0,adjustments:0,total:26618281.37});
  closes(snapshot);
});
