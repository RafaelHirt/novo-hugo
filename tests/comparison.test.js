import test from 'node:test';
import assert from 'node:assert/strict';
import { rows, initial, cost, bedTotals } from '../data.js';
import { model as hugol } from '../hugol-model.js';
import { model as hugo } from '../hugo-model.js';
import { buildComparison } from '../comparison-model.js';

const state = initial(), values = rows.map(row=>Math.round(cost(row,state[row.id])*100)/100);
const current = { rows,state,values,total:27261236.24,beds:bedTotals(state),totals:[...new Set(rows.map(row=>row.group))].map(group=>({group,total:rows.filter(row=>row.group===group).reduce((sum,row)=>sum+Math.round(values[row.id]*100),0)/100})) };
const scenarios = [{id:'current',label:'4 T.A (Atual)',snapshot:current},{id:'hugol',label:'Base R$ HUGOL',snapshot:hugol.snapshot(hugol.presetState('new-0'),{includeOmittedWard:false})},{id:'hugoBase',label:'Base R$ HUGO',snapshot:hugo.snapshot(hugo.presetState('new-0'),{includeOmittedWard:false})}];

test('Comparativo calcula diferenças reais entre os três cenários selecionados',()=>{
  const result=buildComparison(scenarios);
  assert.deepEqual(result.scenarios.map(item=>Math.round(item.delta*100)),[0,12237655,140396532]);
  assert.equal(result.scenarios[0].isReference,true);
  const changed=buildComparison(scenarios,{referenceId:'hugol'});
  assert.equal(Math.round(changed.scenarios[2].delta*100),128158877);
});
test('Visão anual multiplica custos e diferenças por 12 e preserva percentuais e leitos',()=>{
  const monthly=buildComparison(scenarios),annual=buildComparison(scenarios,{annual:true});
  assert.equal(annual.scenarios[0].amount,327134834.88);
  assert.equal(Math.round(annual.scenarios[1].delta*100),146851860);
  assert.ok(Math.abs(annual.scenarios[1].percent-monthly.scenarios[1].percent)<1e-10);
  assert.equal(annual.scenarios[0].snapshot.beds.total,388);
});
test('Filtro de diferenças remove categorias iguais sem alterar os totais',()=>{
  const all=buildComparison(scenarios,{differencesOnly:false}),filtered=buildComparison(scenarios);
  assert.equal(all.groups.some(item=>item.group==='Hospital dia'),true);
  assert.equal(filtered.groups.some(item=>item.group==='Hospital dia'),false);
  assert.equal(filtered.scenarios[0].amount,all.scenarios[0].amount);
  assert.ok(filtered.groups.length<all.groups.length);
});
test('Serviços são alinhados por nome e categoria; busca e referência sem custo não geram percentuais inválidos',()=>{
  const result=buildComparison(scenarios,{query:'ressonancia',differencesOnly:false});
  assert.equal(result.services.length,2);
  assert.ok(result.services.every(row=>row.cells[0].present===false));
  assert.ok(result.services.every(row=>row.cells.every(cell=>cell.percent===null)));
  assert.ok(result.services.every(row=>row.cells.length===3));
});
