import test from 'node:test';
import assert from 'node:assert/strict';
import {model,migrateSavedConfig} from '../production-model.js';
import {buildComparison} from '../comparison-model.js';

const policy={includeOmittedWard:false};
const snapshot=config=>model.snapshot(config,policy);
const current=edits=>({base:'same',selected:[],edits});

test('Valores e produção preserva o prédio atual e aplica apenas as correções aprovadas ao novo prédio',()=>{
  assert.equal(model.presets.length,7);assert.equal(model.presets[0].id,'production');
  assert.equal(model.increments.length,6);assert.equal(model.priceInputs.length,0);
  const s=snapshot(model.presetState('production'));
  assert.equal(s.rows.length,42);assert.equal(s.total,26618281.37);assert.equal(s.delta,0);
  assert.ok(s.rows.every(row=>/^production-\d+$/.test(row.id)));
  assert.throws(()=>model.setIncrement(model.presetState('production'),'wardBeds',true),/indisponível/);
  const newBuilding=snapshot(model.presetState('new-0'));
  assert.equal(newBuilding.rows.length,52);assert.equal(newBuilding.total,30239572.00);
  assert.equal(newBuilding.baseTotal,30239572.00);assert.equal(newBuilding.delta,0);
  assert.ok(newBuilding.rows.every(row=>/^production-increment-new-\d+$/.test(row.id)));
  assert.ok(model.workbookAudit(policy).every(item=>item.difference===(item.base==='new'?934757.97:0)));
});

test('Migração recupera ajustes reais e não restaura a antiga simulação nem seus preços digitados',()=>{
  const saved={version:3,base:'new',selected:['wardBeds','hemodynamics'],edits:{'production-new-6':{qty:1},'production-new-80':{unit:500}},drafts:{same:{base:'same',selected:[],edits:{'production-6':{factor:80}}}}};
  const restored=migrateSavedConfig(saved),expected=current({'production-6':{factor:80}});
  assert.deepEqual(restored,{...expected,drafts:{same:expected}});
  const s=snapshot(restored);assert.equal(s.rows.length,42);assert.equal(s.state['production-6'].factor,80);
  assert.equal(s.baseTotal,26618281.37);assert.equal(s.total,26854683.11);
  for(const version of[2,3]){
    const restored=migrateSavedConfig({version,base:'new',selected:['blood'],edits:{'production-new-83':{unit:100},'production-new-6':{factor:80}}});
    assert.deepEqual(restored,{...current({}),drafts:{same:current({})}});
    assert.equal(snapshot(restored).total,26618281.37);
  }
});

test('Versões anteriores preservam os ajustes do prédio atual e começam sem serviços novos selecionados',()=>{
  for(const saved of[
    {version:1,base:'new',selected:[],edits:{'production-6':{factor:80}}},
    {version:3,base:'same',selected:[],edits:{'production-6':{factor:80}}},
    {version:4,base:'new',selected:[],edits:{'production-6':{factor:80}}},
  ]){
    const expected=current({'production-6':{factor:80}});
    assert.deepEqual(migrateSavedConfig(saved),{...expected,drafts:{same:expected}});
  }
  assert.equal(migrateSavedConfig(null),null);
});

test('Versões 5 e 6 preservam seleções e rascunhos independentes e filtram linhas da base errada',()=>{
  const same=current({'production-6':{factor:80}});
  const next={...model.presetState('new-2'),edits:{'production-increment-new-80':{qty:450},'production-6':{factor:80},'production-new-83':{unit:1}}};
  const clean={...next,edits:{'production-increment-new-80':{qty:450}}};
  for(const version of[5,6]){
    const saved={...next,version,drafts:{same,new:next}};
    const restored=migrateSavedConfig(saved);
    assert.deepEqual(restored,{...clean,drafts:{same,new:clean}});
    assert.equal(snapshot(restored).total,30642946.75);
    assert.equal(snapshot(restored.drafts.same).total,26854683.11);
    const real=migrateSavedConfig({...same,version,drafts:{same,new:clean}});
    assert.deepEqual(real,{...same,drafts:{same,new:clean}});
    assert.equal(snapshot(real).total,26854683.11);
  }
});

test('O comparativo acompanha a base selecionada e os serviços reais, no mês e no ano',()=>{
  const scenarios=[{id:'currentProduction',label:'Prédio atual',snapshot:snapshot(model.presetState('production'))},
    {id:'newProduction',label:'Novo prédio',snapshot:snapshot(model.presetState('new-5'))}];
  const monthly=buildComparison(scenarios,{referenceId:'currentProduction'});
  assert.equal(monthly.scenarios[1].amount,35105608.84);
  assert.equal(monthly.scenarios[1].delta,8487327.47);
  const annual=buildComparison(scenarios,{referenceId:'newProduction',annual:true});
  assert.equal(annual.scenarios[1].amount,421267306.08);
  assert.equal(annual.scenarios[1].isReference,true);
  assert.equal(snapshot(model.presetState('production')).total,26618281.37);
});
