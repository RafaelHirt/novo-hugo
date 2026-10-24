import test from 'node:test';
import assert from 'node:assert/strict';
import { model } from '../rebalance-model.js';
import { rebalanceSource } from '../rebalance-source.js';
import { model as production } from '../production-model.js';
import { occupancyChanges } from '../occupancy.js';
import { buildComparison } from '../comparison-model.js';

const policy={includeOmittedWard:false};
const initial=()=>model.presetState('rebalance');
const snapshot=config=>model.snapshot(config,policy);

test('Reequilíbrio reproduz as 41 linhas e P70 da versão HUGO - ATUAL (PS 75%)',()=>{
  const s=snapshot(initial());
  assert.equal(rebalanceSource.sourceSheet,'HUGO - ATUAL (PS 75%)');
  assert.equal(rebalanceSource.periodLabel,'Janeiro a dezembro/2025');
  assert.equal(s.rows.length,41);assert.equal(s.total,24122514.56);assert.equal(s.baseTotal,24122514.56);assert.equal(s.delta,0);
  assert.equal(s.rows.filter(row=>s.state[row.id].enabled).length,40);
  assert.equal(model.workbookAudit(policy)[0].sourceCell,'P70');assert.equal(model.workbookAudit(policy)[0].difference,0);
  for(const row of s.rows){
    assert.equal(Math.round(s.values[row.id]*100),row.sourceTotalCents,row.name);
    assert.equal(model.volume(row,s.state[row.id]),row.sourceVolume,row.name);
    assert.equal(row.sourceSheet,'HUGO - ATUAL (PS 75%)');
  }
  assert.deepEqual(s.totals.map(item=>item.total),[7818281.72,4855126.01,1662415.50,198797.04,615551.48,5002906.66,3769919.45,173749.65,25767.05]);
});

test('Reequilíbrio usa PS em P75 e registra as três linhas sem destaque verde',()=>{
  const s=snapshot(initial()),row=id=>s.rows.find(item=>item.id==='rebalance-'+id);
  assert.equal(row(21).unit,600.15);assert.equal(row(21).sourceUnitCell,'M21');assert.equal(row(21).unitBasis,'P75');
  assert.equal(row(21).qty,2770);assert.equal(s.values['rebalance-21'],1662415.50);
  assert.equal(row(10).unit,798.74);assert.equal(row(10).unitBasis,'P50');assert.equal(row(10).factor,99);
  assert.deepEqual(s.rows.reduce((map,item)=>(map[item.unitBasis]=(map[item.unitBasis]||0)+1,map),{}),{P50:34,P75:7});
  assert.deepEqual(rebalanceSource.pricingAudit,{greenRows:38,formulaOnlyRows:['rebalance-44','rebalance-61','rebalance-68']});
  for(const id of [44,61,68]){assert.equal(row(id).sourceGreenCell,null);assert.equal(row(id).unitBasis,'P50');assert.match(row(id).sourceFormula,new RegExp(`J${id}\\*L${id}`));}
  assert.equal(row(44).qty,0);assert.equal(s.state['rebalance-44'].enabled,false);assert.equal(s.values['rebalance-44'],0);
  const enabled=snapshot({...initial(),edits:{'rebalance-44':{enabled:true,qty:10}}});assert.equal(enabled.values['rebalance-44'],1882.10);
});

test('A redução de capacidade resulta em 306 enfermaria + 60 UTI, incluindo PS Observação',()=>{
  const s=snapshot(initial());
  assert.deepEqual(s.beds,{ward:306,icu:60,total:366});
  assert.equal(s.rows.filter(row=>row.group==='UTI').length,4);
  assert.equal(s.rows.some(row=>row.name==='UTI Adulto 5'),false);
  const withoutObservation=snapshot({...initial(),edits:{'rebalance-10':{enabled:false}}});
  assert.deepEqual(withoutObservation.beds,{ward:288,icu:60,total:348});
});

test('Ocupação por bloco usa o arredondamento da fonte e preserva preços e o outro bloco',()=>{
  const config=initial(),before=snapshot(config);
  for(const [group,total] of [['Enfermarias',23810336.82],['UTI',23915303.01]]){
    const edits=occupancyChanges(before.rows,before.state,group,80),after=snapshot({...config,edits});
    assert.equal(after.total,total);assert.deepEqual(after.beds,before.beds);
    for(const row of before.rows){
      assert.equal(after.state[row.id].factor,row.group===group?80:before.state[row.id].factor,row.name);
      assert.equal(after.state[row.id].unit,before.state[row.id].unit);
      if(row.group!==group)assert.equal(after.values[row.id],before.values[row.id]);
    }
  }
  assert.equal(snapshot(config).total,24122514.56);
});

test('Reequilíbrio tem ajustes independentes e comparação mensal e anual com a produção anterior',()=>{
  const previous=production.snapshot(production.presetState('production'),policy),rebalance=snapshot(initial());
  const scenarios=[{id:'production',label:'Ago/25 - Jul/26',snapshot:previous},{id:'rebalance',label:'Jan/25 - Dez/25',snapshot:rebalance}];
  const view=buildComparison(scenarios,{referenceId:'production'});assert.equal(view.scenarios[1].delta,-2495766.81);
  const annual=buildComparison(scenarios,{referenceId:'rebalance',annual:true});assert.equal(annual.scenarios[1].amount,289470174.72);assert.equal(annual.scenarios[1].isReference,true);
  snapshot({...initial(),edits:{'rebalance-6':{unit:1100,qty:75}}});
  assert.equal(production.snapshot(production.presetState('production'),policy).total,26618281.37);
});
