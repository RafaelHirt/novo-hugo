import test from 'node:test';
import assert from 'node:assert/strict';
import { model } from '../production-model.js';
import { productionSource } from '../production-source.js';
import { model as updated } from '../updated-model.js';
import { buildComparison } from '../comparison-model.js';
import { occupancyChanges, validOccupancy } from '../occupancy.js';

const policy={includeOmittedWard:false};
const initial=()=>model.presetState('production');
const snapshot=config=>model.snapshot(config,policy);

test('Valores e produção reproduzem as 42 linhas verdes e o total P71 de HUGO - ATUAL',()=>{
  const s=snapshot(initial());
  assert.equal(productionSource.sourceSheet,'HUGO - ATUAL');
  assert.equal(s.rows.length,42);assert.equal(s.total,26618281.37);assert.equal(s.baseTotal,26618281.37);assert.equal(s.delta,0);
  assert.deepEqual(s.beds,{ward:336,icu:70,total:406});
  assert.equal(model.workbookAudit(policy)[0].difference,0);
  const percentiles={};
  for(const row of s.rows){
    assert.equal(Math.round(s.values[row.id]*100),row.sourceTotalCents,row.name);
    assert.equal(model.volume(row,s.state[row.id]),row.sourceVolume,row.name);
    assert.equal(row.sourceGreenCell,row.sourceUnitCell);
    assert.equal(row.sourceSheet,'HUGO - ATUAL');
    percentiles[row.unitBasis]=(percentiles[row.unitBasis]||0)+1;
  }
  assert.deepEqual(percentiles,{P50:34,P75:8});
  assert.deepEqual(s.totals.map(item=>item.total),[8541260.18,6124412.35,1750689.60,210594.45,702949.94,5048378.42,4015703.18,198526.20,25767.05]);
});

test('A produção atualizada usa os percentis verdes e preserva as ocupações de 101% e 120%',()=>{
  const s=snapshot(initial()),row=id=>s.rows.find(item=>item.id==='production-'+id);
  assert.equal(s.state['production-10'].factor,120);assert.equal(s.values['production-10'],491580.54);
  assert.equal(s.state['production-13'].factor,101);assert.equal(s.values['production-13'],1013581.99);
  assert.equal(row(9).unitBasis,'P75');assert.equal(row(9).unit,1402.63);
  assert.equal(row(22).unitBasis,'P75');assert.equal(row(22).sourceUnitCell,'M22');assert.equal(row(22).unit,624.80);
  assert.equal(row(22).qty,2802);assert.equal(s.values['production-22'],1750689.60);
  assert.equal(row(35).qty,937);assert.equal(row(35).factor,2);assert.equal(row(35).sourceVolume,1874);
  assert.equal(row(41).qty,67974);
  const edited=snapshot({...initial(),edits:{'production-10':{factor:120.5},'production-13':{factor:101.5}}});
  assert.equal(edited.state['production-10'].factor,120.5);assert.equal(edited.state['production-13'].factor,101.5);
});

test('Aplicar ocupação de Enfermarias ou UTI fecha o cálculo e mantém o outro bloco',()=>{
  const config=initial(),base=snapshot(config);
  for(const [group,factor,total] of [['Enfermarias',80,26800468.01],['UTI',90,26819677.14]]){
    const edits=occupancyChanges(base.rows,base.state,group,factor),s=snapshot({...config,edits});
    assert.equal(s.total,total);assert.deepEqual(s.beds,base.beds);
    for(const row of base.rows){
      assert.equal(s.state[row.id].factor,row.group===group?factor:base.state[row.id].factor,row.name);
      assert.equal(s.state[row.id].unit,base.state[row.id].unit,row.name);
    }
  }
  assert.equal(snapshot(config).total,26618281.37);
});

test('Ocupação em bloco preserva linhas retiradas e rejeita valores fora do passo de 0,5',()=>{
  const config={...initial(),edits:{'production-10':{enabled:false},'production-6':{unit:1100}}},before=snapshot(config);
  const changes=occupancyChanges(before.rows,before.state,'Enfermarias',80.5);
  assert.equal(Object.keys(changes).length,4);assert.equal(changes['production-10'],undefined);
  const edits={...config.edits};for(const [id,patch] of Object.entries(changes))edits[id]={...edits[id],...patch};
  const after=snapshot({...config,edits});
  assert.equal(after.state['production-6'].unit,1100);
  assert.equal(after.state['production-10'].enabled,false);assert.equal(after.state['production-10'].factor,120);
  for(const value of [0,0.5,80,80.5,101,120])assert.equal(validOccupancy(value),true);
  for(const value of [-1,80.01,NaN,Infinity]){
    assert.equal(validOccupancy(value),false);
    assert.throws(()=>occupancyChanges(before.rows,before.state,'UTI',value),/0,5/);
  }
});

test('Valores e produção têm estado independente e integram o comparativo mensal e anual',()=>{
  const previous=updated.snapshot(updated.presetState('same'),policy),production=snapshot(initial());
  const scenarios=[{id:'updated',label:'Valores',snapshot:previous},{id:'production',label:'Valores e produção',snapshot:production}];
  const view=buildComparison(scenarios,{referenceId:'updated'});
  assert.equal(view.scenarios[1].delta,-1101531.48);
  const annual=buildComparison(scenarios,{referenceId:'production',annual:true});
  assert.equal(annual.scenarios[1].amount,319419376.44);assert.equal(annual.scenarios[1].isReference,true);
  snapshot({...initial(),edits:{'production-6':{qty:50}}});
  assert.equal(updated.snapshot(updated.presetState('same'),policy).total,27719812.85);
});
