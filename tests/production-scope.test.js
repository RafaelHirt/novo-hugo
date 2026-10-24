import test from 'node:test';
import assert from 'node:assert/strict';
import {model,migrateSavedConfig} from '../production-model.js';

const policy={includeOmittedWard:false};
const snapshot=config=>model.snapshot(config,policy);

test('Valores e produção oferece somente os 42 serviços da planilha e não permite incrementos ou novo prédio',()=>{
  assert.equal(model.presets.length,1);assert.equal(model.presets[0].id,'production');
  assert.equal(model.increments.length,0);assert.equal(model.priceInputs.length,0);
  const base=model.presetState('production'),s=snapshot(base);
  assert.equal(s.rows.length,42);assert.equal(s.total,26618281.37);assert.equal(s.delta,0);
  assert.ok(s.rows.every(row=>/^production-\d+$/.test(row.id)));
  assert.throws(()=>model.presetState('new-0'),/não encontrado/);
  assert.throws(()=>model.setIncrement(base,'wardBeds',true),/indisponível/);
});

test('Migração recupera ajustes da planilha quando a simulação de R$ 29 milhões estava selecionada',()=>{
  const saved={version:3,base:'new',selected:['wardBeds','hemodynamics'],edits:{'production-new-6':{qty:1},'production-new-80':{unit:500}},drafts:{same:{base:'same',selected:[],edits:{'production-6':{factor:80}}}}};
  const restored=migrateSavedConfig(saved);
  assert.deepEqual(restored,{base:'new',selected:[],edits:{'production-6':{factor:80}}});
  const s=snapshot(restored);assert.equal(s.rows.length,42);assert.equal(s.state['production-6'].factor,80);
  assert.equal(s.baseTotal,26618281.37);assert.equal(s.total,26854683.11);
});

test('Cache da simulação sem rascunho da planilha volta à base real, descartando serviços e preços simulados',()=>{
  for(const version of [2,3]){
    const restored=migrateSavedConfig({version,base:'new',selected:['blood'],edits:{'production-new-83':{unit:100},'production-new-6':{factor:80}}});
    assert.deepEqual(restored,{base:'new',selected:[],edits:{}});
    assert.equal(snapshot(restored).total,26618281.37);
  }
});

test('Versões anteriores e a versão atual preservam ajustes de linhas da planilha',()=>{
  for(const saved of [
    {version:1,base:'new',selected:[],edits:{'production-6':{factor:80}}},
    {version:3,base:'same',selected:[],edits:{'production-6':{factor:80}}},
    {version:4,base:'new',selected:[],edits:{'production-6':{factor:80}}},
  ]) assert.deepEqual(migrateSavedConfig(saved),{base:'new',selected:[],edits:{'production-6':{factor:80}}});
  assert.equal(migrateSavedConfig(null),null);
});

test('Restaurar os valores retorna ao total da planilha após editar a ocupação',()=>{
  const edited=migrateSavedConfig({version:4,base:'new',selected:[],edits:{'production-6':{factor:80}}});
  assert.notEqual(snapshot(edited).total,26618281.37);
  const restored=snapshot(model.presetState('production'));
  assert.equal(restored.total,26618281.37);assert.equal(restored.state['production-22'].unit,624.8);
});
